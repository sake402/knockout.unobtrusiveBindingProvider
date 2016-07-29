interface HTMLElement {
    getBindingsString(bindingContext: KnockoutBindingContext): string;
}

interface KnockoutStatic {
    bindings: any;
}

((ko) => {
    ((extenders) => {
        ko.utils.extend(extenders, {
            binding(target: any, binding: string) {
                return ko.utils.extend(target, { binding: binding });
            },
            bindings(target: any, bindings: any) {
                return ko.utils.extend(target, { bindings: bindings });
            },
            ignore(target: any, ignore: boolean) {
                return ko.utils.extend(target, { ignore: ignore });
            }
        });
    })(ko.extenders);
    ((bindingProvider) => {
        class NameValuePair {
            constructor(public name: string, public value: any) { }
            toString(node: Node) {
                const value = this.value, name = this.name, nodeName = node.nodeName.toLowerCase();
                if (!value || value.ignore) {
                    return void 0;
                }
                let binding = "text";
                let b = value.binding;
                if (b) {
                    binding = b;
                } else {
                    switch (nodeName) {
                        case "input":
                        case "select":
                            binding = "value";
                    }
                    if (ko.isObservable(value)) {
                        const v = value.peek();
                        if (v && v.push) {
                            binding = nodeName === "select" ? "selectedOptions" : "foreach";
                        } else if (typeof v === "object" && binding === "text") {
                            binding = "with";
                        }
                    } else if (typeof value === "function") {
                        binding = "click";
                    } else if (value.push) {
                        binding = nodeName === "select" ? "selectedOptions" : "foreach";
                    } else if (typeof value === "object") {
                        binding = "with";
                    }
                }
                b = value.bindings;
                if (b) {
                    if (typeof b !== "string") {
                        b = Bindings.from(b);
                    }
                    binding = `${b},${binding}`;
                }
                return binding + ":" + name;
            }
        }
        class Bindings {
            static find(source: any, targets: string[]) {
                let target = "", value = void 0;
                for (var i = 0, l = targets.length; i < l && value === void 0; i++) {
                    target = targets[i];
                    if (target) {
                        value = source[target];
                        if (value === void 0 && /-/.test(target)) {
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
                                } else if (typeof value === "object") {
                                    value = "with";
                                } else if (typeof value === "function") {
                                    value = "click";
                                }
                            }
                            target = names.join(".");
                        }
                    }
                }
                return value === void 0 ? null : new NameValuePair(target, value);
            };
            static from(value: any) {
                return typeof value === "string" ? value : (value = ko.toJSON(value)).substr(1, value.length - 2);
            };
        }
        Object.defineProperty(Node.prototype, "classNames", {
            get() {
                return this.className.trim().replace(/(\s|\u00A0){2,}/g, " ").split(/(\s|\u00A0)/g).filter(s => s !== " ");
            }
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
        Object.defineProperty(HTMLBodyElement.prototype, "path", {
            get() { return ""; }
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
        var cache = {};
        HTMLElement.prototype.getBindingsString = function (bindingContext: KnockoutBindingContext) {
            if (this.nodeType === 1) { // HTML elements only
                const path = this.path;
                let value = cache[path];
                if (value === void 0) { // First time
                    const targets = this.targets;
                    if (targets.length) { // has an id, a name or classes
                        let overridden = void 0, nvp = Bindings.find(ko.bindings, targets);
                        if (nvp) {
                            let v = nvp.value;
                            if (v.bindings) {
                                overridden = v.override;
                                v = v.bindings;
                            }
                            value = Bindings.from(v);
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
                if (value && location.hostname === "localhost") {
                    this.setAttribute("data-bind", value);
                }
                return value;
            }
            return void 0;
        };
        ((instance) => {
            instance.getBindingsString = (node: HTMLElement, bindingContext: KnockoutBindingContext) => node.getBindingsString(bindingContext);
            instance.nodeHasBindings = (node: HTMLInputElement) => node.nodeType === 1 && (node.id || node.name || node.className);
        })(bindingProvider.instance);
    })(ko.bindingProvider);
})(ko);