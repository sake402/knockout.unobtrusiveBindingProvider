(function (ko) {
    (function (extenders) {
        ko.utils.extend(extenders, {
            binding: function (target, binding) {
                return ko.utils.extend(target, { binding: binding });
            },
            bindings: function (target, bindings) {
                return ko.utils.extend(target, { bindings: bindings });
            }
        });
    })(ko.extenders);
    (function (bindingProvider) {
        var NameValuePair = (function () {
            function NameValuePair(name, value) {
                this.name = name;
                this.value = value;
            }
            NameValuePair.prototype.toString = function (node) {
                var value = this.value, name = this.name, nodeName = node.nodeName.toLowerCase();
                if (!value) {
                    return undefined;
                }
                var binding = "text";
                switch (nodeName) {
                    case "input":
                    case "select":
                        binding = "value";
                }
                if (ko.isObservable(value)) {
                    var v = value.peek();
                    if (v && v.push) {
                        binding = nodeName === "select" ? "selectedOptions" : "foreach";
                    }
                    else if (typeof v === "object" && binding === "text") {
                        binding = "with";
                    }
                }
                else if (value instanceof Function) {
                    binding = "click";
                }
                else if (value.push) {
                    binding = nodeName === "select" ? "selectedOptions" : "foreach";
                }
                else if (typeof value === "object") {
                    binding = "with";
                }
                var b = value.binding;
                if (b) {
                    binding = b;
                }
                b = value.bindings;
                if (b) {
                    if (typeof b !== "string") {
                        if (b.override) {
                            return b.value;
                        }
                        b = Bindings.from(b.value);
                    }
                    binding = b + "," + binding;
                }
                return binding + ":" + name;
            };
            return NameValuePair;
        }());
        var Bindings = (function () {
            function Bindings() {
            }
            Bindings.find = function (source, targets) {
                var target = "", value = undefined;
                for (var i = 0, l = targets.length; i < l && value === undefined; i++) {
                    target = targets[i];
                    if (target) {
                        value = source[target];
                        if (value === undefined && /-/.test(target)) {
                            var names = target.split("-");
                            for (var j = 0, m = names.length; j < m; j++) {
                                target = names[j];
                                value = source[target];
                                if (value === undefined) {
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
                                        value = undefined;
                                        break;
                                    }
                                }
                                else if (typeof value === "object") {
                                    value = "with";
                                }
                                else if (typeof value === "function") {
                                    value = "click";
                                }
                            }
                            target = names.join(".");
                        }
                    }
                }
                return value === undefined ? null : new NameValuePair(target, value);
            };
            ;
            Bindings.from = function (value) {
                return typeof value === "string" ? value : (value = ko.toJSON(value)).substr(1, value.length - 2);
            };
            ;
            return Bindings;
        }());
        Object.defineProperty(Node.prototype, "classNames", {
            get: function () {
                return this.className.trim().replace(/(\s|\u00A0){2,}/g, " ").split(/(\s|\u00A0)/g).filter(function (s) { return s !== " "; });
            }
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
        Object.defineProperty(HTMLBodyElement.prototype, "path", {
            get: function () { return ""; }
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
        var cache = {};
        HTMLElement.prototype.getBindingsString = function (bindingContext) {
            if (this.nodeType === 1) {
                var path = this.path;
                var value = cache[path];
                if (value === undefined) {
                    var targets_1 = this.targets;
                    if (targets_1.length) {
                        var overridden = undefined, nvp_1 = Bindings.find(ko.bindings, targets_1);
                        if (nvp_1) {
                            var v = nvp_1.value;
                            if (v && v.bindings) {
                                overridden = v.override;
                                v = v.bindings;
                            }
                            value = Bindings.from(v);
                        }
                        if (!overridden) {
                            nvp_1 = Bindings.find(bindingContext.$data, targets_1);
                            if (!nvp_1) {
                                bindingContext.$parents.forEach(function (parent, i) {
                                    nvp_1 = Bindings.find(parent, targets_1);
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
                if (value && location.hostname === "localhost") {
                    this.setAttribute("data-bind", value);
                }
                return value;
            }
            return undefined;
        };
        (function (instance) {
            instance.getBindingsString = function (node, bindingContext) { return node.getBindingsString(bindingContext); };
            instance.nodeHasBindings = function (node) { return node.nodeType === 1 && (node.id || node.name || node.className); };
        })(bindingProvider.instance);
    })(ko.bindingProvider);
})(ko);
