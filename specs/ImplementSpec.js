/* global describe, beforeEach, it, expect, topiarist, err */
describe("topiarist.implement", function() {
	if (typeof topiarist === 'undefined') topiarist = require('../lib/topiarist.js');
	var err = topiarist._err;

	var Class, Interface;

	beforeEach(function() {
		// This horrible structure is to avoid a bug in IE8 where the obvious way of writing this
		// would have created *locals* ChildClass and ParentClass and not modified the values from
		// the above scope.
		Class = (function() {
			return function Class() {};
		})();
		Interface = (function() {
			return function Interface() {};
		})();
		Interface.prototype.interfaceMethod = function() {};
		Interface.prototype.anotherInterfaceMethod = function() {};
	});

	it("throws an error if the class is not a function.", function() {
		Class = 23;
		expect(function() {
			topiarist.implement(Class, Interface);
		}).toThrow(err.NOT_CONSTRUCTOR("Class", "implement", "number"));
	});

	it("throws an error if the interface is not a function.", function() {
		Interface = 23;
		expect(function() {
			topiarist.implement(Class, Interface);
		}).toThrow(err.NOT_CONSTRUCTOR('Protocol', 'implement', "number"));
	});

	it("throws an error if the class doesn't implement all the methods specified by the interface.", function() {
		expect(function() {
			topiarist.implement(Class, Interface);
		}).toThrow( err.DOES_NOT_IMPLEMENT('Class', ['interfaceMethod', 'anotherInterfaceMethod'].join("', '"), 'Interface') );
	});

	it("throws an error if the class doesn't implement all the 'class' methods specified by the interface.", function() {
		Class.prototype.interfaceMethod = function() {};
		Class.prototype.anotherInterfaceMethod = function() {};

		Interface.staticMethod = function() {};

		expect(function() {
			topiarist.implement(Class, Interface);
		}).toThrow(err.DOES_NOT_IMPLEMENT('Class', 'staticMethod (class method)', 'Interface'));
	});

	it("does not throw an error if the class implements all the methods specified by the interface.", function() {
		Class.prototype.interfaceMethod = function() {};
		Class.prototype.anotherInterfaceMethod = function() {};

		topiarist.implement(Class, Interface);
		expect(true).toBe(true);
	});

	it("does not throw an error if the class inherits (using topiarist.extend) methods required by the interface.", function() {
		Class.prototype.interfaceMethod = function() {};
		Class.prototype.anotherInterfaceMethod = function() {};

		function ChildClass() {}
		topiarist.extend(ChildClass, Class);

		topiarist.implement(ChildClass, Interface);
		expect(true).toBe(true);
	});

});