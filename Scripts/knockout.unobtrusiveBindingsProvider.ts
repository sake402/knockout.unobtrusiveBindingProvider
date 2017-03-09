interface Node {
    text: string;
    getBindingsString(bindingContext: KnockoutBindingContext): string;
}

interface KnockoutStatic {
    bindings: any;
    debug: boolean;
}

interface KnockoutUtils {
    emptyDomNode: (node: Node) => void;
}

interface KnockoutVirtualElements {
    hasBindingValue: (node: Node) => boolean;
    virtualNodeBindingValue: (node: Comment) => boolean;
}

((ko: KnockoutStatic) => {
    class NameValuePair {
        constructor(public name: string, public value: any) { }
        toString(element: HTMLInputElement) {
            const value = this.value, nodeName = element.nodeName.toLowerCase();
            if (!value || value.ignore) {
                return void 0;
            }
            let binding = "text";
            let b = value.binding;
            if (b) {
                if (typeof value === "function" && !ko.isObservable(value)) {
                    b = `event:{${b}`;
                    this.name += "}";
                }
                binding = b;
            } else {
                switch (nodeName) {
                    case "input":
                    case "select":
                        binding = "value";
                }
                let v = value;
                if (ko.isObservable(v)) {
                    v = v.peek();
                }
                if (v.push) {
                    binding = nodeName === "select" ? "selectedOptions" : "foreach";
                } else if (typeof v === "function") {
                    binding = "click";
                } else if (typeof v === "boolean") {
                    const t = element.type;
                    binding = t === "checkbox" || t === "radio" ? "checked" : "visible";
                } else if (typeof v === "object" && binding === "text") {
                    binding = "with";
                }
            }
            b = value.bindings;
            if (b) {
                binding = `${b},${binding}`;
            }
            return binding + ":" + this.name;
        }
    }
    class Bindings {
        static find(source: any, targets: string[]) {
            if (!source) {
                return null;
            }
            let target = "", value = void 0;
            for (var i = 0, l = targets.length; i < l && value === void 0; i++) {
                target = targets[i];
                if (target) {
                    value = source[target];
                    if (value === void 0) {
                        if (/-/.test(target)) {
                            const names = target.split("-");
                            for (var j = 0, m = names.length; j < m; j++) {
                                target = names[j];
                                value = source[target];
                                if (value === void 0) {
                                    break;
                                } else if (ko.isObservable(value)) {
                                    if (j < m - 1) {
                                        names[j] += "()";
                                    }
                                    source = ko.unwrap(value);
                                } else if (j < m - 1) {
                                    if (typeof value === "object") {
                                        source = value;
                                    } else {
                                        value = void 0;
                                        break;
                                    }
                                }
                            }
                            target = names.join(".");
                        } else if (target === "item" && typeof source !== "object") {
                            target = "$data";
                            value = source;
                        }
                    }
                }
            }
            return value === void 0 ? null : new NameValuePair(target, value);
        };
    }
    var commentNodesHaveTextProperty = document && document.createComment("test").text === "<!--test-->";
    Object.defineProperty(Node.prototype, "classNames", {
        get() {
            return this.className.trim().replace(/(\s|\u00A0){2,}/g, " ").split(/(\s|\u00A0)/g).filter(s => s !== " ");
        }
    });
    Object.defineProperty(Node.prototype, "path", {
        get() {
            let value = this.nodeName.toLowerCase();
            if (this.id) {
                value += `#${this.id}`;
            }
            if (this.className) {
                value += `.${this.classNames.join(".")}`;
            }
            if (this.name) {
                value += `?${this.name}`;
            }
            let parentPath = this.parentNode.path;
            if (parentPath) {
                parentPath += "/";
            }
            return parentPath + value;
        }
    });
    Object.defineProperty(Comment.prototype, "path",
    {
        get() {
            const value = `<!--${commentNodesHaveTextProperty ? this.text : this.nodeValue}-->`;
            let parentPath = this.parentNode.path;
            if (parentPath) {
                parentPath += "/";
            }
            return parentPath + value;
        }
    });
    Object.defineProperty(Comment.prototype, "targets",
    {
        get() { return [ko.virtualElements.virtualNodeBindingValue(this)]; }
    });
    Object.defineProperty(Comment.prototype, "text",
    {
        get() { return commentNodesHaveTextProperty ? this.text : this.nodeValue; }
    });
    Object.defineProperty(HTMLBodyElement.prototype, "path", {
        get() { return ""; }
    });
    Object.defineProperty(HTMLElement.prototype, "targets", {
        get() {
            let values = [];
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
    Node.prototype.getBindingsString = function (bindingContext: KnockoutBindingContext) {
        if ([1,8].indexOf(this.nodeType) !== -1) { // HTML elements only
            const path = this.path;
            let value = cache[path];
            if (value === void 0) { // First time
                var targets = this.targets;
                if (targets.length) { // has an id, a name, classes or is a virutal element
                    let overridden = void 0, nvp = Bindings.find(ko.bindings, targets);
                    if (nvp) {
                        let v = nvp.value;
                        if (v.bindings) {
                            overridden = v.override;
                            v = v.bindings;
                        }
                        value = v;
                    }
                    if (!overridden) {
                        nvp = Bindings.find(bindingContext.$data, targets);
                        if (!nvp) {
                            bindingContext.$parents.forEach((parent, i) => {
                                nvp = Bindings.find(parent, targets);
                                if (nvp) {
                                    nvp.name = `$parents[${i}].${nvp.name}`;
                                }
                            });
                        }
                        if (nvp) {
                            const s = nvp.toString(this);
                            s && value ? value += `,${s}` : value = s;
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
    ((extenders: KnockoutExtenders) => {
        ko.utils.extend(extenders, {
            binding(target: any, value: string) {
                return ko.utils.extend(target, { binding: value });
            },
            bindings(target: any, value: any) {
                return ko.utils.extend(target, { bindings: value });
            },
            ignore(target: any, value: boolean) {
                return ko.utils.extend(target, { ignore: value });
            }
        });
    })(ko.extenders);
    ((instance) => {
        instance.getBindingsString = (node: Node, bindingContext: KnockoutBindingContext) => node.getBindingsString(bindingContext);
        instance.nodeHasBindings = (node: HTMLInputElement) => (node.nodeType === 1 && (node.id || node.name || node.className)) || (node.nodeType === 8 && ko.virtualElements.hasBindingValue(node));
    })(ko.bindingProvider.instance);
    ((virtualElements) => {
        var startCommentRegex = commentNodesHaveTextProperty ? /^\x3c!--\s*(?:([a-zA-Z]\w*))\:\s*--\x3e$/ : /^\s*(?:([a-zA-Z]\w*))\:\s*$/;
        var endCommentRegex = commentNodesHaveTextProperty ? /^\x3c!--\s*\/(?:([a-zA-Z]\w*))\s*--\x3e$/ : /^\s*\/(?:([a-zA-Z]\w*))\s*$/;
        var isStartComment = (node: Comment) => {
            return node.nodeType === 8 && startCommentRegex.test(node.text);
        };
        var isEndComment = (node: Comment) => {
            return node.nodeType === 8 && endCommentRegex.test(node.text);
        };
        var getVirtualChildren = (startComment: Node, allowUnbalanced = false) => {
            var currentNode = startComment;
            var depth = 1;
            var children = [];
            while ((currentNode = currentNode.nextSibling)) {
                if (isEndComment(currentNode as Comment)) {
                    depth--;
                    if (depth === 0)
                        return children;
                }

                children.push(currentNode);

                if (isStartComment(currentNode as Comment))
                    depth++;
            }
            if (!allowUnbalanced)
                throw new Error(`Cannot find closing comment tag to match: ${ko.virtualElements.virtualNodeBindingValue(startComment as Comment)}`);
            return null;
        };
        var getMatchingEndComment = (startComment: Node, allowUnbalanced = false) => {
            var allVirtualChildren = getVirtualChildren(startComment, allowUnbalanced);
            if (allVirtualChildren) {
                if (allVirtualChildren.length > 0)
                    return allVirtualChildren[allVirtualChildren.length - 1].nextSibling;
                return startComment.nextSibling;
            } else
                return null; // Must have no matching end comment, and allowUnbalanced is true
        };
        virtualElements.childNodes = (node: Node) => {
            return isStartComment(node as Comment) ? getVirtualChildren(node) : node.childNodes;
        };
        virtualElements.emptyNode = (node: Node) => {
            if (!isStartComment(node as Comment))
                ko.utils.emptyDomNode(node);
            else {
                const virtualChildren = this.childNodes(node);
                for (var i = 0, j = virtualChildren.length; i < j; i++)
                    ko.removeNode(virtualChildren[i]);
            }
        };
        virtualElements.setDomNodeChildren = (node: Node, childNodes: Node[]) => {
            if (!isStartComment(node as Comment)) {
                ko.utils.setDomNodeChildren(node, childNodes);
            }
            else {
                ko.virtualElements.emptyNode(node);
                const endCommentNode = node.nextSibling; // Must be the next sibling, as we just emptied the children
                for (var i = 0, j = childNodes.length; i < j; i++)
                    endCommentNode.parentNode.insertBefore(childNodes[i], endCommentNode);
            }
        };
        virtualElements.prepend = (containerNode: Node, nodeToPrepend: Node) => {
            if (!isStartComment(containerNode as Comment)) {
                if (containerNode.firstChild)
                    containerNode.insertBefore(nodeToPrepend, containerNode.firstChild);
                else
                    containerNode.appendChild(nodeToPrepend);
            } else {
                // Start comments must always have a parent and at least one following sibling (the end comment)
                containerNode.parentNode.insertBefore(nodeToPrepend, containerNode.nextSibling);
            }
        };
        virtualElements.Fb = virtualElements.insertAfter = (containerNode: Node, nodeToInsert: Node, insertAfterNode: Node) => {
            if (!insertAfterNode) {
                ko.virtualElements.prepend(containerNode, nodeToInsert);
            } else if (!isStartComment(containerNode as Comment)) {
                // Insert after insertion point
                if (insertAfterNode.nextSibling)
                    containerNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
                else
                    containerNode.appendChild(nodeToInsert);
            } else {
                // Children of start comments must always have a parent and at least one following sibling (the end comment)
                containerNode.parentNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
            }
        };
        virtualElements.firstChild = (node: Node) => {
            if (!isStartComment(node as Comment))
                return node.firstChild;
            if (!node.nextSibling || isEndComment(node.nextSibling as Comment))
                return null;
            return node.nextSibling;
        };
        virtualElements.nextSibling = (node: Node) => {
            if (isStartComment(node as Comment))
                node = getMatchingEndComment(node);
            if (node.nextSibling && isEndComment(node.nextSibling as Comment))
                return null;
            return node.nextSibling;
        };
        virtualElements.hasBindingValue = isStartComment;
        virtualElements.virtualNodeBindingValue = (node: Comment) => {
            var regexMatch = (node.text).match(startCommentRegex);
            return regexMatch ? regexMatch[1] : null;
        };
    })(ko.virtualElements);
})(ko);