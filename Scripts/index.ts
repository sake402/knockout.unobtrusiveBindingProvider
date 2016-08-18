class Meal {
    formattedPrice: KnockoutComputed<string>;
    name: KnockoutObservable<string>;
    price: KnockoutObservable<number>;
    constructor(name: string, price?: number) {
        this.name = ko.observable(name).extend({ binding: "textInput" });
        this.price = ko.observable(price || 0);
        this.formattedPrice = ko.computed(() => (this.price() ? `$${Number(this.price.peek()).toFixed(2)}` : "None"), null, { deferEvaluation: true, pure: true });
    }
}
class Seat {
    additions: KnockoutObservableArray<string>;
    meal: KnockoutObservable<Meal>;
    constructor(public name: string, meal: Meal, additions?: string[]) {
        this.meal = ko.observable(meal).extend({ bindings: "options:$root.meals,optionsText:'name'" });
        this.additions = ko.observableArray(additions || []).extend({ bindings: "options:$root.additions,attr:{multiple:'multiple'}" });
    }
}
class Reservations {
    additions = ["Baggage", "Skis", "Wheelchair"];
    addSeat: any;
    count: KnockoutComputed<number>;
    meals = ko.utils.extend([
        new Meal("Standard (sandwich)"),
        new Meal("Premium (lobster)", 34.95),
        new Meal("Ultimate (whole zebra)", 290)
    ], { bindings: "visible:editable" });
    removeSeat: (seat: Seat) => void;
    seats = ko.observableArray([
        new Seat("Fred", this.meals[0]),
        new Seat("Bert", this.meals[1], this.additions.filter((item, index) => index !== 1))
    ]).extend({ bindings: "attr:{title:'seats'}" });
    showSurcharge: KnockoutComputed<boolean>;
    totalSurcharge: KnockoutComputed<string>;
    editable = ko.observable(true);
    constructor() {
        this.count = ko.computed(() => this.seats().length);
        this.totalSurcharge = ko.computed(() => this.seats().reduce((total, seat) => (total + Number(seat.meal().price())), 0).toFixed(2));
        this.showSurcharge = ko.computed(() => this.totalSurcharge() !== "0.00");
        this.addSeat = ko.utils.extend(() => { this.seats.push(new Seat("", this.meals[0])); }, { /*binding: "mouseover",*/ bindings: "enable:seats().length<5" });
        this.removeSeat = seat => this.seats.remove(seat);
    }
}
var model = new Reservations();
ko.bindings = {
    "list-additions": { bindings: "text:additions" },
    content: "template:'reservations'",
    "seats-table": "visible:count"
};
ko.applyBindings(model, document.getElementById("content"));