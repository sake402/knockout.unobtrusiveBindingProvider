var Meal = (function () {
    function Meal(name, price) {
        var _this = this;
        this.name = ko.observable(name).extend({ binding: "textInput" });
        this.price = ko.observable(price || 0);
        this.formattedPrice = ko.computed(function () { return (_this.price() ? "$" + Number(_this.price.peek()).toFixed(2) : "None"); }, null, { deferEvaluation: true, pure: true });
    }
    return Meal;
}());
var Seat = (function () {
    function Seat(name, meal, additions) {
        this.name = name;
        this.meal = ko.observable(meal).extend({ bindings: "options:$root.meals,optionsText:'name'" });
        this.additions = ko.observableArray(additions || []).extend({ bindings: "options:$root.additions,attr:{multiple:'multiple'}" });
    }
    return Seat;
}());
var Reservations = (function () {
    function Reservations() {
        var _this = this;
        this.additions = ["Baggage", "Skis", "Wheelchair"];
        this.meals = ko.utils.extend([
            new Meal("Standard (sandwich)"),
            new Meal("Premium (lobster)", 34.95),
            new Meal("Ultimate (whole zebra)", 290)
        ], { bindings: "attr:{title:'available meals'}" });
        this.seats = ko.observableArray([
            new Seat("Steve", this.meals[0]),
            new Seat("Bert", this.meals[1], this.additions.filter(function (item, index) { return index !== 1; }))
        ]).extend({ bindings: { attr: { title: "seats" } } });
        this.count = ko.computed(function () { return _this.seats().length; });
        this.totalSurcharge = ko.computed(function () { return _this.seats().reduce(function (total, seat) { return (total + Number(seat.meal().price())); }, 0).toFixed(2); });
        this.showSurcharge = ko.computed(function () { return _this.totalSurcharge() !== "0.00"; }).extend({ binding: "visible" });
        this.addSeat = ko.utils.extend(function () { _this.seats.push(new Seat("", _this.meals[0])); }, { bindings: "enable:seats().length<5" });
        this.removeSeat = function (seat) { return _this.seats.remove(seat); };
    }
    return Reservations;
}());
var model = new Reservations();
ko.bindings = {
    "list-additions": { bindings: "text:additions" },
    content: "template:'reservations'",
    "seats-table": "visible:count"
};
ko.applyBindings(model, document.getElementById("content"));
