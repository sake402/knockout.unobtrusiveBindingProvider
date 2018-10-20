var _this = this;
(function (ko) {
    var NameValuePair = (function () {
        function NameValuePair(name, value) {
            this.name = name;
            this.value = value;
        }
        NameValuePair.prototype.toString = function (element) {
            var value = this.value, nodeName = element.nodeName.toLowerCase();
            if (!value || value.ignore) {
                return "";
            }
            var binding = "text";
            var b = value.binding;
            if (b) {
                if (typeof value === "function" && !ko.isObservable(value)) {
                    b = "event:{" + b;
                    this.name += "}";
                }
                binding = b;
            }
            else {
                switch (nodeName) {
                    case "input":
                    case "select":
                        binding = "value";
                }
                var v = value;
                if (ko.isObservable(v)) {
                    v = v.peek();
                }
                if (v && v.push) {
                    binding = nodeName === "select" ? "selectedOptions" : "foreach";
                }
                else if (typeof v === "function") {
                    binding = "click";
                }
                else if (typeof v === "boolean") {
                    var t = element.type;
                    binding = t === "checkbox" || t === "radio" ? "checked" : "visible";
                }
                else if (typeof v === "object" && binding === "text") {
                    binding = "with";
                }
            }
            b = value.bindings;
            if (b) {
                binding = b + "," + binding;
            }
            return binding + ":" + this.name;
        };
        return NameValuePair;
    }());
    var Bindings = (function () {
        function Bindings() {
        }
        Bindings.find = function (source, target) {
            if (!source) {
                return null;
            }

            var value = void 0;
            if (target) {
                value = source[target];
                var isSelector = target.startsWith("#") || target.startsWith(".");
                if (ko.bindings) {
                    var binding = ko.bindings[target];
                    if (binding)
                        isSelector = binding.isSelector || isSelector;
                }
                //if (!value) {
                //    if (isSelector) { // a selector
                //        var binding = ko.bindings[target];
                //        if (binding.observe) {
                //            target = binding.observe;
                //        } else {
                //            target = target.slice(1, target.length);
                //        }
                //        value = source[target];
                //    }
                //}
                if (isSelector === false && /-/.test(target)) {
                    var names = target.split("-");
                    for (var j = 0, m = names.length; j < m; j++) {
                        target = names[j];
                        value = source[target];
                        if (value === void 0) {
                            break;
                        }
                        else if (ko.isObservable(value)) {
                            if (j < m - 1) {
                                names[j] += "()";
                            }
                            source = ko.unwrap(value);
                        }
                        else if (j < m - 1) {
                            if (typeof value === "object") {
                                source = value;
                            }
                            else {
                                value = void 0;
                                break;
                            }
                        }
                    }
                    target = names.join(".");
                }
                else if (target === "item" && typeof source !== "object") {
                    target = "$data";
                    value = source;
                }
            }
            return value === void 0 ? null : new NameValuePair(target, value);
        };
        ;
        return Bindings;
    }());
    var hasValue = function (value) { return value !== void 0 && value !== null && value !== ""; };
    var commentNodesHaveTextProperty = document && document.createComment("test").text === "<!--test-->";
    Object.defineProperty(Node.prototype, "classNames", {
        get: function () {
            return this.className.trim().replace(/(\s|\u00A0){2,}/g, " ").split(/(\s|\u00A0)/g).filter(function (s) { return s !== " "; });
        }
    });
    Object.defineProperty(Node.prototype, "path", {
        get: function () {
            var value = this.nodeName.toLowerCase();
            if (this.id) {
                value += "#" + this.id;
            }
            if (this.className) {
                value += "." + this.classNames.join(".");
            }
            if (this.name) {
                value += "?" + this.name;
            }
            var parentPath = this.parentNode.path;
            if (parentPath) {
                parentPath += "/";
            }
            return parentPath + value;
        }
    });
    Object.defineProperty(Comment.prototype, "path", {
        get: function () {
            var value = "<!--" + (commentNodesHaveTextProperty ? this.text : this.nodeValue) + "-->";
            var parentPath = this.parentNode.path;
            if (parentPath) {
                parentPath += "/";
            }
            return parentPath + value;
        }
    });
    Object.defineProperty(Comment.prototype, "targets", {
        get: function () { return [ko.virtualElements.virtualNodeBindingValue(this)]; }
    });
    Object.defineProperty(Comment.prototype, "text", {
        get: function () { return commentNodesHaveTextProperty ? this.text : this.nodeValue; }
    });
    Object.defineProperty(HTMLBodyElement.prototype, "path", {
        get: function () { return ""; }
    });
    Object.defineProperty(HTMLElement.prototype, "targets", {
        get: function () {
            var values = [];
            if (jQuery && ko.bindings) {
                for (k in ko.bindings) {
                    if (jQuery(this).is(k)) {
                        values.push(k);
                        return values;
                    }
                }
            }            
            if (this.id) {
                values.push(this.id);
            }
            if (this.name) {
                values.push(this.name);
            }
            if (this.className) {
                values = values.concat(this.classNames);
            }
            return values;
        }
    });
    var cache = {};
    Node.prototype.getBindingsString = function (bindingContext) {
        if ([1, 8].indexOf(this.nodeType) !== -1) {
            var path = this.path;
            var value = cache[path];
            if (value === void 0) {
                var targets = this.targets;
                var bindings = new Array();
                for (var i = 0; i < targets.length; i++) {
                    var overridden = void 0, nvp = Bindings.find(ko.bindings, targets[i]);
                    if (nvp) {
                        var v = nvp.value;
                        if (v.bindings) {
                            overridden = v.override;
                            v = v.bindings;
                        }
                        value = v;
                    }
                    if (overridden) {
                        break;
                    }
                    nvp = Bindings.find(bindingContext.$data, targets[i]);
                    if (!nvp) {
                        var parents = bindingContext.$parents;
                        for (var j = 0; j < parents.length; j++) {
                            nvp = Bindings.find(parents[j], targets[i]);
                            if (nvp) {
                                nvp.name = "$parents[" + j + "]." + nvp.name;
                                break;
                            }
                        }
                    }
                    if (nvp) {
                        bindings.push(nvp.toString(this));
                    }
                }
                if (bindings.length) {
                    var s = bindings.join();
                    s && value ? value += "," + s : value = s;
                }
                cache[path] = value || null;
            }
            if (this.nodeType !== 8 && value && ko.debug) {
                this.setAttribute("data-bind", value);
            }
            return value || this.getAttribute("data-bind");
        }
        return void 0;
    };
    ko.debug = location.hostname === "localhost" || location.protocol === "file:";
    (function (extenders) {
        ko.utils.extend(extenders, {
            binding: function (target, value) {
                return ko.utils.extend(target, { binding: value });
            },
            bindings: function (target, value) {
                return ko.utils.extend(target, { bindings: value });
            },
            ignore: function (target, value) {
                return ko.utils.extend(target, { ignore: value });
            }
        });
    })(ko.extenders);
    (function (instance) {
        instance.getBindingsString = function (node, bindingContext) { return node.getBindingsString(bindingContext); };
        instance.nodeHasBindings = function (node) {
            if (jQuery && ko.bindings) {
                for (k in ko.bindings) {
                    if (jQuery(node).is(k)) {
                        return true;
                    }
                }
            }
            if (node.getAttribute && node.getAttribute("data-bind")) {
                return true;
            }
            return (node.nodeType === 1 && (hasValue(node.id) || hasValue(node.name) || hasValue(node.className))) || (node.nodeType === 8 && ko.virtualElements.hasBindingValue(node));
        };
    })(ko.bindingProvider.instance);
    (function (virtualElements) {
        var startCommentRegex = commentNodesHaveTextProperty ? /^\x3c!--\s*(?:([a-zA-Z]\w*))\:\s*--\x3e$/ : /^\s*(?:([a-zA-Z]\w*))\:\s*$/;
        var endCommentRegex = commentNodesHaveTextProperty ? /^\x3c!--\s*\/(?:([a-zA-Z]\w*))\s*--\x3e$/ : /^\s*\/(?:([a-zA-Z]\w*))\s*$/;
        var isStartComment = function (node) {
            return node.nodeType === 8 && startCommentRegex.test(node.text);
        };
        var isEndComment = function (node, start) {
            return node.nodeType === 8 && endCommentRegex.test(node.text) && virtualElements.virtualNodeBindingValue(node, endCommentRegex) === virtualElements.virtualNodeBindingValue(start);
        };
        var getVirtualChildren = function (start, allowUnbalanced) {
            if (allowUnbalanced === void 0) { allowUnbalanced = false; }
            var currentNode = start;
            var depth = 1;
            var children = [];
            while ((currentNode = currentNode.nextSibling)) {
                if (isEndComment(currentNode, start)) {
                    depth--;
                    if (depth === 0)
                        return children;
                }
                children.push(currentNode);
                if (isStartComment(currentNode))
                    depth++;
            }
            if (!allowUnbalanced)
                throw new Error("Cannot find closing comment tag to match: " + ko.virtualElements.virtualNodeBindingValue(start));
            return null;
        };
        var getMatchingEndComment = function (start, allowUnbalanced) {
            if (allowUnbalanced === void 0) { allowUnbalanced = false; }
            var allVirtualChildren = getVirtualChildren(start, allowUnbalanced);
            return allVirtualChildren ? (allVirtualChildren.length > 0 ? allVirtualChildren[allVirtualChildren.length - 1].nextSibling : start.nextSibling) : null;
        };
        virtualElements.childNodes = function (node) {
            return isStartComment(node) ? getVirtualChildren(node) : node.childNodes;
        };
        virtualElements.emptyNode = function (node) {
            if (!isStartComment(node))
                ko.utils.emptyDomNode(node);
            else {
                var virtualChildren = _this.childNodes(node);
                for (var i = 0, j = virtualChildren.length; i < j; i++)
                    ko.removeNode(virtualChildren[i]);
            }
        };
        virtualElements.setDomNodeChildren = function (node, childNodes) {
            if (!isStartComment(node)) {
                ko.utils.setDomNodeChildren(node, childNodes);
            }
            else {
                ko.virtualElements.emptyNode(node);
                var endCommentNode = node.nextSibling;
                for (var i = 0, j = childNodes.length; i < j; i++)
                    endCommentNode.parentNode.insertBefore(childNodes[i], endCommentNode);
            }
        };
        virtualElements.prepend = function (containerNode, nodeToPrepend) {
            if (!isStartComment(containerNode)) {
                if (containerNode.firstChild)
                    containerNode.insertBefore(nodeToPrepend, containerNode.firstChild);
                else
                    containerNode.appendChild(nodeToPrepend);
            }
            else {
                containerNode.parentNode.insertBefore(nodeToPrepend, containerNode.nextSibling);
            }
        };
        virtualElements.Fb = virtualElements.insertAfter = function (containerNode, nodeToInsert, insertAfterNode) {
            if (!insertAfterNode) {
                ko.virtualElements.prepend(containerNode, nodeToInsert);
            }
            else if (!isStartComment(containerNode)) {
                if (insertAfterNode.nextSibling)
                    containerNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
                else
                    containerNode.appendChild(nodeToInsert);
            }
            else {
                containerNode.parentNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
            }
        };
        virtualElements.firstChild = function (node) {
            if (!isStartComment(node))
                return node.firstChild;
            if (!node.nextSibling || isEndComment(node.nextSibling, node))
                return null;
            return node.nextSibling;
        };
        virtualElements.nextSibling = function (node) {
            var start = null;
            if (isStartComment(node)) {
                start = node;
                node = getMatchingEndComment(start);
            }
            if (node.nextSibling && isEndComment(node.nextSibling, start))
                return null;
            return node.nextSibling;
        };
        virtualElements.hasBindingValue = isStartComment;
        virtualElements.virtualNodeBindingValue = function (node, regex) {
            var regexMatch = node && (node.text).match(regex || startCommentRegex);
            return regexMatch ? regexMatch[1] : null;
        };
    })(ko.virtualElements);
})(ko);
