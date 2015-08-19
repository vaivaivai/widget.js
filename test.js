
(function() {
"use strict";

if (typeof(module) !== "undefined") {
    global.ring = require("ring");
    global.assert = require("assert");
    global._ = require("underscore");
    var jsdom = require("jsdom").jsdom;
    var doc = jsdom();
    var window = doc.parentWindow;
    global.$ = require("jquery")(window);
    global.widget = require("./widget")(window);
}

suite("LifeCycle");

test("base", function() {
    var x = new widget.LifeCycle();
    assert.equal(!!x.getDestroyed(), false);
    x.destroy();
    assert.equal(x.getDestroyed(), true);
});

test("parents", function() {
    var x = new widget.LifeCycle();
    var y = new widget.LifeCycle();
    y.setParent(x);
    assert.equal(y.getParent(), x);
    assert.equal(x.getChildren()[0], y);
    x.destroy();
    assert.equal(x.getDestroyed(), true);
    assert.equal(y.getDestroyed(), true);
});

suite("Events");

test("base", function() {
    var x = new widget.internal.Events();
    var tmp = 0;
    var fct = function() {tmp = 1;};
    x.on("test", fct);
    assert.equal(tmp, 0);
    x.trigger("test");
    assert.equal(tmp, 1);
    tmp = 0;
    x.off("test", fct);
    x.trigger("test");
    assert.equal(tmp, 0);
});

suite("EventDispatcher");

test("base", function() {
    var x = new widget.EventDispatcher();
    var tmp = 0;
    var fct = function() {tmp = 1;};
    x.on("test", fct);
    assert.equal(tmp, 0);
    x.trigger("test");
    assert.equal(tmp, 1);
    tmp = 0;
    x.off("test", fct);
    x.trigger("test");
    assert.equal(tmp, 0);
    tmp = 0;
    x.on("test", fct);
});

test("context", function() {
    var x = new widget.EventDispatcher();
    var tmp = null;
    x.on("test", function() {
        tmp = this;
    });
    x.trigger("test");
    assert.strictEqual(tmp, undefined);
    tmp = null;
    x.on("test2", function() {
        tmp = this;
    }, "test");
    x.trigger("test2");
    assert.strictEqual(tmp, "test");
});

test("static events", function() {
    var tmp = 0;
    var Claz = ring.create(widget.EventDispatcher, {
        events: {
            testevent: function() {
                tmp = 1;
            }
        }
    });
    var x = new Claz();
    assert.equal(tmp, 0);
    x.trigger("testevent");
    assert.equal(tmp, 1);
    
    tmp = 0;
    var tmp2 = 0;
    var Claz2 = ring.create(Claz, {
        events: {
            testevent2: function() {
                tmp2 = 1;
            }
        }
    });
    var y = new Claz2();
    assert.equal(tmp, 0);
    assert.equal(tmp2, 0);
    y.trigger("testevent");
    assert.equal(tmp, 1);
    assert.equal(tmp2, 0);
    y.trigger("testevent2");
    assert.equal(tmp, 1);
    assert.equal(tmp2, 1);
});

test("static events context", function() {
    var tmp = null;
    var Claz = ring.create(widget.EventDispatcher, {
        events: {
            test: "test"
        },
        test: function() {
            tmp = this;
        }
    });
    var x = new Claz();
    x.trigger("test");
    assert.strictEqual(tmp, x);
});

suite("Properties");

test("base-accessors", function() {
    var Claz = ring.create([widget.Properties], {
        getStuff: function() {
            return this.stuff;
        },
        setStuff: function(val) {
            this.stuff = val;
        }
    });
    var Claz2 = ring.create([Claz], {
        getThing: function() {
            return this.thing;
        },
        setThing: function(val) {
            this.thing = val;
        }
    });
    var x = new Claz();
    x.set("stuff", "stuff");
    assert.equal(x.stuff, "stuff");
    assert.equal(x.getStuff(), "stuff");
    assert.equal(x.get("stuff"), "stuff");
    x = new Claz();
    x.setStuff("stuff");
    assert.equal(x.stuff, "stuff");
    assert.equal(x.getStuff(), "stuff");
    assert.equal(x.get("stuff"), "stuff");
    x = new Claz2();
    x.set("stuff", "stuff");
    assert.equal(x.stuff, "stuff");
    assert.equal(x.getStuff(), "stuff");
    assert.equal(x.get("stuff"), "stuff");
    x.set("thing", "thing");
    assert.equal(x.thing, "thing");
    assert.equal(x.getThing(), "thing");
    assert.equal(x.get("thing"), "thing");
    x = new Claz2();
    x.setStuff("stuff");
    assert.equal(x.stuff, "stuff");
    assert.equal(x.getStuff(), "stuff");
    assert.equal(x.get("stuff"), "stuff");
    x.setThing("thing");
    assert.equal(x.thing, "thing");
    assert.equal(x.getThing(), "thing");
    assert.equal(x.get("thing"), "thing");
});

test("base-dynamic", function() {
    var x = new widget.Properties();
    x.set({test: 1});
    assert.equal(x.get("test"), 1);
    var tmp = 0;
    x.on("change:test", function(model, options) {
        tmp = 1;
        assert.equal(options.oldValue, 1);
        assert.equal(options.newValue, 2);
        assert.equal(x.get("test"), 2);
        assert.equal(model, x);
    });
    x.set({test: 2});
    assert.equal(tmp, 1);
});

test("change event only when changed", function() {
    var x = new widget.Properties();
    var exec1 = false;
    x.on("change:test", function() {exec1 = true;});
    x.set({"test": 3});
    assert.equal(exec1, true);
    exec1 = false;
    x.set({"test": 3});
    assert.equal(exec1, false);
});

suite("Widget");

test("base", function() {
    var Claz = ring.create([widget.Widget], {
        tagName: "span",
        className: "mytestspan",
        attributes: {
            "id": "testspan"
        },
        render: function() {
            this.$().html("test");
        }
    });
    var x = new Claz();
    x.appendTo($("body"));
    var $el = $("#testspan");
    assert.equal($el.length, 1);
    assert.equal($el.parents()[0], $("body")[0]);
    assert.equal($el.html(), "test");
    assert.equal($el[0], $("span.mytestspan")[0]);
    
    var y = new Claz(x);
    assert.equal(y.getParent(), x);
    
    x.destroy();
    $el = $("#testspan");
    assert.equal($el.length, 0);
});

test("domEvents", function() {
    var test = 0;
    var Claz = ring.create([widget.Widget], {
        domEvents: {
            "testevent": function() {
                test = 1;
            },
            "testevent2 .testspan": function() {
                test = 2;
            }
        },
        render: function() {
            this.$().html("<span class='testspan'></span>");
        }
    });
    var x = new Claz();
    x.appendTo($("body"));
    assert.equal(test, 0);
    x.$().trigger("testevent");
    assert.equal(test, 1);
    x.$(".testspan").trigger("testevent2");
    assert.equal(test, 2);
});

test("appendEvents", function() {
    var x = new widget.Widget();
    var y = new widget.Widget();
    assert.strictEqual(x.__widgetAppended, false);
    assert.strictEqual(y.__widgetAppended, false);
    y.appendTo(x.$());
    assert.strictEqual(x.__widgetAppended, false);
    assert.strictEqual(y.__widgetAppended, false);
    x.appendTo($("body"));
    assert.strictEqual(x.__widgetAppended, true);
    assert.strictEqual(y.__widgetAppended, true);
    y.detach();
    assert.strictEqual(x.__widgetAppended, true);
    assert.strictEqual(y.__widgetAppended, false);
    y.appendTo(x.$());
    assert.strictEqual(x.__widgetAppended, true);
    assert.strictEqual(y.__widgetAppended, true);
    x.detach();
    assert.strictEqual(x.__widgetAppended, false);
    assert.strictEqual(y.__widgetAppended, false);
    
    x.destroy();
    y.destroy();
});

})();
