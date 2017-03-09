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
                return void 0;
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
                if (v.push) {
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
        Bindings.find = function (source, targets) {
            if (!source) {
                return null;
            }
            var target = "", value = void 0;
            for (var i = 0, l = targets.length; i < l && value === void 0; i++) {
                target = targets[i];
                if (target) {
                    value = source[target];
                    if (value === void 0) {
                        if (/-/.test(target)) {
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
                }
            }
            return value === void 0 ? null : new NameValuePair(target, value);
        };
        ;
        return Bindings;
    }());
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
                if (targets.length) {
                    var overridden = void 0, nvp_1 = Bindings.find(ko.bindings, targets);
                    if (nvp_1) {
                        var v = nvp_1.value;
                        if (v.bindings) {
                            overridden = v.override;
                            v = v.bindings;
                        }
                        value = v;
                    }
                    if (!overridden) {
                        nvp_1 = Bindings.find(bindingContext.$data, targets);
                        if (!nvp_1) {
                            bindingContext.$parents.forEach(function (parent, i) {
                                nvp_1 = Bindings.find(parent, targets);
                                if (nvp_1) {
                                    nvp_1.name = "$parents[" + i + "]." + nvp_1.name;
                                }
                            });
                        }
                        if (nvp_1) {
                            var s = nvp_1.toString(this);
                            s && value ? value += "," + s : value = s;
                        }
                    }
                }
                cache[path] = value || null;
            }
            if (this.nodeType !== 8 && value && ko.debug) {
                this.setAttribute("data-bind", value);
            }
            return value;
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
        instance.nodeHasBindings = function (node) { return (node.nodeType === 1 && (node.id || node.name || node.className)) || (node.nodeType === 8 && ko.virtualElements.hasBindingValue(node)); };
    })(ko.bindingProvider.instance);
    (function (virtualElements) {
        var startCommentRegex = commentNodesHaveTextProperty ? /^\x3c!--\s*(?:([a-zA-Z]\w*))\:\s*--\x3e$/ : /^\s*(?:([a-zA-Z]\w*))\:\s*$/;
        var endCommentRegex = commentNodesHaveTextProperty ? /^\x3c!--\s*\/(?:([a-zA-Z]\w*))\s*--\x3e$/ : /^\s*\/(?:([a-zA-Z]\w*))\s*$/;
        var isStartComment = function (node) {
            return node.nodeType === 8 && startCommentRegex.test(node.text);
        };
        var isEndComment = function (node) {
            return node.nodeType === 8 && endCommentRegex.test(node.text);
        };
        var getVirtualChildren = function (startComment, allowUnbalanced) {
            if (allowUnbalanced === void 0) { allowUnbalanced = false; }
            var currentNode = startComment;
            var depth = 1;
            var children = [];
            while ((currentNode = currentNode.nextSibling)) {
                if (isEndComment(currentNode)) {
                    depth--;
                    if (depth === 0)
                        return children;
                }
                children.push(currentNode);
                if (isStartComment(currentNode))
                    depth++;
            }
            if (!allowUnbalanced)
                throw new Error("Cannot find closing comment tag to match: " + ko.virtualElements.virtualNodeBindingValue(startComment));
            return null;
        };
        var getMatchingEndComment = function (startComment, allowUnbalanced) {
            if (allowUnbalanced === void 0) { allowUnbalanced = false; }
            var allVirtualChildren = getVirtualChildren(startComment, allowUnbalanced);
            if (allVirtualChildren) {
                if (allVirtualChildren.length > 0)
                    return allVirtualChildren[allVirtualChildren.length - 1].nextSibling;
                return startComment.nextSibling;
            }
            else
                return null;
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
            if (!node.nextSibling || isEndComment(node.nextSibling))
                return null;
            return node.nextSibling;
        };
        virtualElements.nextSibling = function (node) {
            if (isStartComment(node))
                node = getMatchingEndComment(node);
            if (node.nextSibling && isEndComment(node.nextSibling))
                return null;
            return node.nextSibling;
        };
        virtualElements.hasBindingValue = isStartComment;
        virtualElements.virtualNodeBindingValue = function (node) {
            var regexMatch = (node.text).match(startCommentRegex);
            return regexMatch ? regexMatch[1] : null;
        };
    })(ko.virtualElements);
})(ko);
