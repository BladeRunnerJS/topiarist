/* global describe, beforeEach, it, expect, topiary, err */
describe("topiary.inherit", function() {
	var Class, Parent, MultiParent;

	beforeEach(function() {
		Class = function() {};
		Parent = function() {};
		topiary.extend(Class, Parent);
		MultiParent = function() {};
	});

	it("throws an error if the target is not a constructor.", function() {
		expect( function() {
			topiary.inherit(23, MultiParent);
		}).toThrow(err.NOT_CONSTRUCTOR('Target', 'inherit', 'number'));
	});

	it("throws an error if the inherited parent is null.", function() {
		expect( function() {
			topiary.inherit(Class, null);
		}).toThrow(err.WRONG_TYPE('Parent', 'inherit', 'non-null object or function', 'null'));
	});

	it("copies inherited functionality across to the class.", function() {
		var inheritedFuncRan = false;
		MultiParent.prototype.inheritedFunc = function() {
			inheritedFuncRan = true;
		};
		topiary.inherit(Class, MultiParent);

		var instance = new Class();
		instance.inheritedFunc();

		expect(inheritedFuncRan).toBe(true);
	});

	it("allows inherited functionality to affect instance state.", function() {
		MultiParent.prototype.inheritedFunc = function() {
			this.state = "modified by inherited function";
		};
		topiary.inherit(Class, MultiParent);

		var instance = new Class();
		instance.inheritedFunc();

		expect(instance.state).toBe("modified by inherited function");
	});

	it("throws an error if an inherited parent has functions that clash with the target class.", function() {
		MultiParent.prototype.thingy = function() {};
		MultiParent.prototype.clashingThingy = function() {};

		Class.prototype.clashingThingy = function() {};

		expect(function() {
			topiary.inherit(Class, MultiParent);
		}).toThrow(err.ALREADY_PRESENT('clashingThingy', 'parent', 'target'));
	});

	it("does not copy any functionality if it can't copy everything.", function() {
		MultiParent.prototype.thingy = function() {};
		MultiParent.prototype.clashingThingy = function() {};

		Class.prototype.clashingThingy = function() {};

		try {
			topiary.inherit(Class, MultiParent);
		} catch (e) {}

		expect(Class.prototype.thingy).toBeUndefined();
	});

	it("copies functionality from an inherited classes parents.", function() {
		function MultiOverMixin() {};
		MultiOverMixin.prototype.mixedIn = function() {};

		function MultiOverParent() {};
		MultiOverParent.prototype.uber = function() {};
		topiary.extend(MultiParent, MultiOverParent);
		topiary.mixin(MultiParent, MultiOverMixin);

		topiary.inherit(Class, MultiParent);

		var instance = new Class();

		expect(typeof instance.mixedIn).toBe('function');
		expect(typeof instance.uber).toBe('function');
	});

	it("does not throw an error if we attempt to inherit something that has already been inherited higher up the tree, even if that has then been modified.", function() {
		function MultiOverMixin() {};
		MultiOverMixin.prototype.mixedIn = function() {};

		function MultiOverParent() {};
		MultiOverParent.prototype.uber = function() {};
		topiary.extend(MultiParent, MultiOverParent);
		topiary.mixin(MultiParent, MultiOverMixin);

		// override uber
		MultiParent.prototype.uber = function() {};

		topiary.inherit(Class, MultiParent);

		topiary.inherit(Class, MultiOverParent);

		var instance = new Class();

		expect(instance.uber).toBe(MultiParent.prototype.uber );
	});
});