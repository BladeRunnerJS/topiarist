/* global describe, beforeEach, it, expect, topiary, err */
describe("topiary.isAssignableFrom", function() {
	var ChildClass, ParentClass, InterfaceClass, MixinClass, OtherClass, ParentsInterface, ParentsMixin;

	beforeEach(function() {
		InterfaceClass = function InterfaceClass() {};
		MixinClass = function MixinClass() {};
		OtherClass = function OtherClass() {};

		ParentsInterface = function ParentsInterface() {};
		ParentsMixin = function ParentsMixin() {};
		ParentClass = function ParentClass() {};
		topiary.implement(ParentClass, ParentsInterface);
		topiary.mixin(ParentClass, ParentsMixin);

		ChildClass = function ChildClass() {};
		topiary.extend(ChildClass, ParentClass);
		topiary.mixin(ChildClass, MixinClass);
		topiary.implement(ChildClass, InterfaceClass);
	});

	it('throws an error if the class is not a constructor.', function() {
		expect( function() {
			topiary.isAssignableFrom(34, ParentClass);
		}).toThrow(err.CLASS_NOT_CONSTRUCTOR('number', 'isAssignableFrom'));
	});

	it('throws an error if the potential assignee is not a constructor.', function() {
		expect( function() {
			topiary.isAssignableFrom(ChildClass, 34);
		}).toThrow(err.PARENT_NOT_CONSTRUCTOR('Parent', 'isAssignableFrom', 'number'));
	});

	it('returns true for a class and itself.', function() {
		expect( topiary.isAssignableFrom(ChildClass, ChildClass)).toBe( true );
	});

	it('returns true for a class and an interface it implements.', function() {
		expect( topiary.isAssignableFrom(ChildClass, InterfaceClass)).toBe( true );
	});

	it('returns true for a class and a mixin it mixed in (theoretically, a violation, but this is probably useful behaviour).', function() {
		expect( topiary.isAssignableFrom(ChildClass, MixinClass)).toBe( true );
	});

	it('returns true for a class and a class it extends.', function() {
		expect( topiary.isAssignableFrom(ChildClass, ParentClass)).toBe( true );
	});

	it('returns true for a class and an interface that a parent extends.', function() {
		expect( topiary.isAssignableFrom(ChildClass, ParentsInterface)).toBe( true );
	});

	it('returns true for a class and something the parent mixed in (theoretically, a violation, but this is probably useful behaviour).', function() {
		expect( topiary.isAssignableFrom(ChildClass, ParentsMixin)).toBe( true );
	});

	it('returns false for a class and an unrelated other class.', function() {
		expect( topiary.isAssignableFrom(ChildClass, OtherClass)).toBe( false );
	});
});
