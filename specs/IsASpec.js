/* global describe, beforeEach, it, expect, topiary, err */
describe("topiary.isA", function() {
	var instance, ChildClass, ParentClass, InterfaceClass, MixinClass, OtherClass, ParentsInterface, ParentsMixin;

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

		instance = new ChildClass();
	});

	it('throws an error if the potential assignee is not a constructor.', function() {
		expect( function() {
			topiary.isA(instance, 34);
		}).toThrow(err.PARENT_NOT_CONSTRUCTOR('Parent', 'isA', 'number'));
	});

	it('returns false for a null instance.', function() {
		expect( topiary.isA(null, ChildClass)).toBe( false );
	});

	it('returns true for an instance and its constructor.', function() {
		expect( topiary.isA(instance, ChildClass)).toBe( true );
	});

	it('returns true for an instance and an interface it implements.', function() {
		expect( topiary.isA(instance, InterfaceClass)).toBe( true );
	});

	it('returns true for an instance and a mixin its class mixed in (theoretically, a violation, but this is probably useful behaviour).', function() {
		expect( topiary.isA(instance, MixinClass)).toBe( true );
	});

	it('returns true for an instance and its superclass.', function() {
		expect( topiary.isA(instance, ParentClass)).toBe( true );
	});

	it('returns true for an instance and an interface that a parent extends.', function() {
		expect( topiary.isA(instance, ParentsInterface)).toBe( true );
	});

	it('returns true for an instance and something the parent mixed in (theoretically, a violation, but this is probably useful behaviour).', function() {
		expect( topiary.isA(instance, ParentsMixin)).toBe( true );
	});

	it('returns false for a instance and an unrelated other class.', function() {
		expect( topiary.isA(instance, OtherClass)).toBe( false );
	});
});