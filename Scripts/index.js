var MealReservation = (function () {
    function MealReservation(name, price) {
        var _this = this;
        this.name = ko.observable(name).extend({ binding: "textInput" });
        this.price = ko.observable(price);
        this.formattedPrice = ko.computed(function () { return (_this.price() ? "$" + Number(_this.price.peek()).toFixed(2) : "None"); }, null, { deferEvaluation: true, pure: true });
    }
    return MealReservation;
})();
var SeatReservation = (function () {
    function SeatReservation(name, initialMeal, additions) {
        this.name = name;
        this.bindings = { meal: "options:$root.availableMeals,optionsText:'name'" };
        this.meal = ko.observable(initialMeal);
        this.additions = ko.observableArray(additions || []).extend({ bindings: "options:$root.additions,attr:{multiple:'multiple'}" });
    }
    return SeatReservation;
})();
var ReservationsViewModel = (function () {
    function ReservationsViewModel() {
        var _this = this;
        this.additions = ["Baggage", "Skis", "Wheelchair"];
        this.availableMeals = [
            new MealReservation("Standard (sandwich)", 0),
            new MealReservation("Premium (lobster)", 34.95),
            new MealReservation("Ultimate (whole zebra)", 290)
        ];
        this.seats = ko.observableArray([
            new SeatReservation("Steve", this.availableMeals[0]),
            new SeatReservation("Bert", this.availableMeals[1], this.additions.filter(function (item, index) { return index !== 1; }))
        ]).extend({ bindings: { value: "attr:{title:'seats'}" } });
        this.count = ko.computed(function () { return _this.seats().length; });
        this.totalSurcharge = ko.computed(function () { return _this.seats().reduce(function (total, seat) { return (total + Number(seat.meal().price())); }, 0).toFixed(2); });
        this.showSurcharge = ko.computed(function () { return _this.totalSurcharge() !== "0.00"; }).extend({ binding: "visible" });
        this.addSeat = ko.utils.extend(function () {
            _this.seats.push(new SeatReservation("", _this.availableMeals[0]));
        }, { bindings: "enable:seats().length<5" });
        this.removeSeat = function (seat) { return _this.seats.remove(seat); };
    }
    return ReservationsViewModel;
})();
var model = new ReservationsViewModel();
ko.bindingProvider["bindings"] = {
    content: "template: 'reservations'",
    seats: "visible:count",
    "additions-list": { bindings: "text:additions" },
    availableMeals: "attr:{title:'available meals'}"
};
ko.applyBindings(model, document.getElementById("content"));
