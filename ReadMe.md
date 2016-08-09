﻿knockout.unobtrusiveBindingProvider
================
*knockout.unobtrusiveBindingProvider* is an unobtrusive, convention-based binding provider for [Knockout JS](http://knockoutjs.com/) that enables a clean separation of HTML and Knockout databindings.


As Knockout traverses the DOM,  the *unobtrusiveBindingProvider* analyses each HTML element and:

1. Using the `id`, `name` (for `<input>` or `<select>` tags) or a `class` name, attempts to map to a member of the current `$data` object; and
2. Based on the HTML element and the type of the member, determines what binding should be used (see the Table below).

| HTML element | Member type | Binding |
|--------------|-------------|---------|
| \* | Number, String |	text |
| \* | Object, Observable | with |
| \* | Array, ObservableArray | foreach |
| \* | Function | click |
| input | Number, String, Observable | value |
| select | Object, Number, String, Observable | value |
| select | Array, ObservableArray | selectedOptions |

* If the appropriate member isn't found, in the current context, the *unobtrusiveBindingProvider* will attempt to find one by bubbling up through the parent contexts.
* Where an element has multiple classes and a member hasn't already been mapped, the *unobtrusiveBindingProvider* will attempt to map each class until a member has been found.
* If the target (`id`, `name` or `class`) is hyphonated and a member hasn't already been mapped, then the *unobtrusiveBindingProvider* will regard this as a path to a member in the object graph and will attempt to navigate through the object graph until it reaches the destination member. However, if any part of the hyphonated target doesn't match a path in the object graph, the mapping will be terminated. If any part of the path is an observable then the parentheses should be *omitted*.

Where a member has been mapped and the member is an observable, the *unobtrusiveBindingProvider* will analyse the member and determine if the mapped binding should be overridden (the `binding` extender) and/or whether there are additional bindings (the `bindings` extender):

```js
this.name = ko.observable(name).extend({ binding: "textInput" });
this.meal = ko.observable(meal).extend({ bindings: "options:$root.meals,optionsText:'name'" });
```

If a member is an Array or Function the `ko.utils.extend` method can be used to add bindings:

```js
this.meals = ko.utils.extend([
    new Meal("Standard (sandwich)"),
    new Meal("Premium (lobster)", 34.95),
    new Meal("Ultimate (whole zebra)", 290)
], { bindings: "attr:{title:'available meals'}" });
```

Overriding the binding of a function will map the binding to the [`event` binding](http://knockoutjs.com/documentation/event-binding.html)

```js
this.addSeat = ko.utils.extend(function () {...}, { binding: "keypress" });
```

Members that shouldn't be bound to the view, but which match the `id`, `name` or a `class`, can be ignored (the `ignore` extender):

```js
this.fullName = ko.pureComputed(...).extend({ ignore: true });
```

HTML elements that don't map to a member of the model will be mapped to a member of the `ko.bindings` object:

```html
<div id="content"></div>
```

```js
ko.bindings = {
    content: "template:'reservations'"
};
```

It can be useful to see what bindings are being generated and so there is a `ko.debug` flag that will add the `data-bind` attribute to HTML element:

```js
ko.debug = location.hostname === "dev.stevenbey.com";
```

Note: the *unobtrusiveBindingProvider* automatically sets `ko.debug` to `true` where the hostname is `localhost` or the protocol is `file:`.

Dependencies
------------
* Knockout 2.0+

Examples
--------
Review the `index.html` file for examples and test it with jsFiddle: [Unobtrusive databinding in Knockout JS](http://jsfiddle.net/stevenbey/nhbygo49/).

License
-------
MIT [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)

Nuget
-----
[knockout.unobtrusiveBindingProvider](https://www.nuget.org/packages/knockout.unobtrusiveBindingProvider/)

Further reading
---------------
See [Unobtrusive databinding in Knockout JS](http://stevenbey.com/unobtrusive-databinding-in-knockout-js).