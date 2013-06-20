;(function() {
	"use strict";

	var ERROR_MESSAGES = {
		SUBCLASS_NOT_CONSTRUCTOR: "Subclass was not a constructor.",
		SUPERCLASS_NOT_CONSTRUCTOR: "Superclass was not a constructor when extending {0}.",
		PROTOTYPE_NOT_CLEAN: 'Prototype must be clean to extend another class. {0} has already been defined on the prototype of {1}.',
		CLASS_NOT_CONSTRUCTOR: 'Class definition for {1} must be a constructor, was {0}.',
		PARENT_NOT_CONSTRUCTOR: '{0} definition for {1} must be a constructor, was {2}.',
		DOES_NOT_IMPLEMENT: "Class {0} does not implement the attributes '{1}' from protocol {2}."
	};

	/* jshint evil:true */
	var global = (new Function('return this;'))();

	/**
	 * Returns a nonenumerable property if it exists, or creates one
	 * and returns that if it does not.
	 * @private
	 */
	function nonenum(object, propertyName, defaultValue) {
		var value = object[propertyName];
		if (value === undefined) {
			value = defaultValue;
			Object.defineProperty(object, propertyName, {
				enumerable: false,
				value: value
			});
		}
		return value;
	}

	/** @private **/
	function msg(str) {
		if (str == null) { return null; }
		for (var i = 1, len = arguments.length; i < len; ++i) {
			str = str.replace("{"+(i-1)+"}", (arguments[i] || "").toString());
		}
		return str;
	}

	/** @private */
	var currentId = 0;
	/**
	 * Returns the nonenumerable property __id__ of an object
	 * if it exists, otherwise adds one and returns that.
	 * @private
	 */
	function classId(func) {
		var result = func.__id__;
		if (result == null) {
			result = nonenum(func, '__id__', currentId++);
		}
		return result;
	}

	/**
	 * Gets the classname of an object or function if it can.  Otherwise returns the default.
	 * @private
	 */
	function className(object, defaultName) {
		var result = "";
		if (typeof object === 'function') {
			result = object.name;
		} else if (object.constructor) {
			result = object.constructor.name;
		}
		return result || defaultName;
	}

	/**
	 * Returns an array of all of the properties on protocol that are not on classdef
	 * or are of a different type on classdef.
	 * @private
	 */
	function missingAttributes(classdef, protocol) {
		var result = [], obj = classdef.prototype, requirement = protocol.prototype;
		for (var item in requirement) {
			if (typeof obj[item] !== typeof requirement[item]) {
				result.push(item);
			}
		}
		return result;
	}

	/**
	 * Copies all properties from the source to the target (including inherited properties)
	 * but makes them not enumerable.
	 * @private
	 */
	function copy(source, target, hidden) {
		for (var key in source) {
			Object.defineProperty(target, key, {
				enumerable: hidden !== true,
				value: source[key]
			});
		}
		return target;
	}

	/**
	 * Turns a function into a method by using 'this' as the first argument.
	 * @private
	 */
	function makeMethod(func) {
		return function() {
			var args = [this].concat(Array.prototype.slice.call(arguments));
			return func.apply(null, args);
		};
	}

	/* Public methods */

	/**
	 * Sets up the prototype chain for inheritance.
	 *
	 * As well as setting up the prototype chain, this also copies so called 'static'
	 * definitions from the superclass to the subclass, makes sure that constructor
	 * will return the correct thing, and provides a 'superclass' property.
	 *
	 * @throws Error if the prototype has been modified before extend is called.
	 *
	 * @param classdef {function} The constructor of the subclass.
	 * @param superclass {function} The constructor of the superclass.
	 */
	function extend(classdef, superclass) {
		if (typeof classdef !== 'function') { throw new TypeError(msg(ERROR_MESSAGES.SUBCLASS_NOT_CONSTRUCTOR)); }
		var subclassName = className(classdef, "Subclass");
		if (typeof superclass !== 'function') { throw new TypeError(msg(ERROR_MESSAGES.SUPERCLASS_NOT_CONSTRUCTOR, subclassName)); }
		for (var key in classdef.prototype) {
			throw new Error(msg(ERROR_MESSAGES.PROTOTYPE_NOT_CLEAN, key, subclassName));
		}

		for (var staticProperty in superclass) {
			if (superclass.hasOwnProperty(staticProperty)) {
				classdef[staticProperty] = superclass[staticProperty];
			}
		}
		classdef.prototype = Object.create(superclass.prototype, {
			constructor: {
				enumerable: false,
				value: classdef
			},
			superclass: {
				enumerable: false,
				value: superclass.prototype
			}
		});
	}

	// brian approved mixin:
	// doesn't blow up if the mixin function is exactly the same as what is already there.
	function simpleMixin(target, mix) {
		if (typeof target !== 'function') { throw new TypeError('Target for mixin must be a constructor, was '+typeof(target)+'.'); }
		if (mix == null) { throw new TypeError('Mix for mixin must not be null or undefined.'); }

		var targetPrototype = target.prototype;
		var mixinProperties = mix;
		if (typeof mix === 'function') {
			mixinProperties = mix.prototype;
		}
		for (var property in mixinProperties) {
			if (property in target === false) {
				targetPrototype[property] = mixinProperties[property];
			} else if (targetPrototype[property] !== mixinProperties[property]) {
				throw new Error('Could not copy '+property+' from '+className(mix, 'mixin') + ' to ' + className(target, 'target') + ' as it was already present.');
			}
		}

		var mixins = nonenum(target, '__mixins__', []);
		mixins.push(mix);
	}

	// dom approved mixin:
	// doesn't blow up if you try to mixin something already mixed in up the hierarchy, even
	// if it has been modified somewhere up the hierarchy.
	function diamondMixin(target, mix) {
		if (typeof target !== 'function') { throw new TypeError('Target for mixin must be a constructor, was '+typeof(target)+'.'); }
		if (mix == null) { throw new TypeError('Mix for mixin must not be null or undefined.'); }

		if ( isAssignableFrom(target, mix) ) {
			// already done
			return;
		}
		var mixins = nonenum(target, '__mixins__', []);
		var targetPrototype = target.prototype;
		var mixinProperties = mix;
		if (typeof mix === 'function') {
			mixinProperties = mix.prototype;
		}
		for (var key in mixinProperties) {
			if ( key in targetPrototype === false ) {
				targetPrototype[key] = mixinProperties[key];
			} else if (mixinProperties.hasOwnProperty(key)) {
				throw new Error('Could not copy '+key+' from '+className(mix, 'mixin') + ' to ' + className(target, 'target') + ' as it was already present.');
			}
		}
		// now mixin from our prototype chain
		var mixinParent = Object.getPrototypeOf(mix.prototype).constructor;
		if (mixinParent) {
			diamondMixin(target, mixinParent);
		}
		// and our own mixins
		for (var i = 0; i < mixins.length; ++i) {
			diamondMixin(target, mixins[i]);
		}

		mixins.push(mix);
	}

	/**
	 * Declares that the provided class implements the provided protocol.
	 *
	 * This involves checking that it does in fact implement the protocol and updating an
	 * internal list of interfaces attached to the class definition.
	 *
	 * It should be called after implementations are provided, i.e. at the end of the class definition.
	 *
	 * @throws Error if there are any attributes on the protocol that are not matched on the class definition.
	 *
	 * @param classdef {function} A constructor that should create objects matching the protocol.
	 * @param protocol {function} A constructor representing an interface that the class should implement.
	 */
	function implement(classdef, protocol) {
		if (typeof classdef !== 'function') { throw new TypeError(msg(ERROR_MESSAGES.CLASS_NOT_CONSTRUCTOR, typeof(classdef), 'implement')); }
		if (typeof protocol !== 'function') { throw new TypeError(msg(ERROR_MESSAGES.PARENT_NOT_CONSTRUCTOR, 'Protocol', 'implement', typeof(protocol))); }

		var interfaces = nonenum(classdef, '__interfaces__', []);
		var missing = missingAttributes(classdef, protocol);
		if (missing.length > 0) {
			throw new Error(msg(ERROR_MESSAGES.DOES_NOT_IMPLEMENT, className(classdef, "provided"), missing.join("', '"), className(protocol, "provided")));
		} else {
			interfaces.push(protocol);
		}
	}

	/** @private */
	function fallbackIsAssignableFrom(classdef, parent) {
		if (classdef === parent || classdef.prototype instanceof parent) {
			return true;
		}
		var i,
			mixins = classdef.__mixins__ || [],
			interfaces = classdef.__interfaces__ || [];

		// parent
		var superproto = Object.getPrototypeOf(classdef.prototype);
		if (superproto != null && isAssignableFrom(superproto.constructor, parent)) {
			return true;
		}

		// mixin chain
		for (i = 0; i < mixins.length; ++i) {
			if (isAssignableFrom(mixins[i], parent)) {
				return true;
			}
		}
		// interfaces chain
		for (i = 0; i < interfaces.length; ++i) {
			if (isAssignableFrom(interfaces[i], parent)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Checks to see if a class is a descendant of another class / interface / mixin.
	 *
	 * A class is a descendant of another class if the other class is in its prototype chain.
	 * A class is a descendant of an interface if it has called implement that class or
	 * any class that this class is a descendant of has called implement for that class.
	 * A class is a descendant of a mixin if it has called mixin for that mixin or
	 * any class that this class is a descendant of has called mixin for that mixin.
	 *
	 * @param classdef {function} the child class.
	 * @param constructor {function} the class to check if this class is a descendant of.
	 * @returns {boolean} true if the class is a descendant, false otherwise.
	 */
	function isAssignableFrom(classdef, constructor) {
		if (typeof classdef !== 'function') { throw new TypeError(msg(ERROR_MESSAGES.CLASS_NOT_CONSTRUCTOR, typeof(classdef), 'isAssignableFrom')); }
		if (typeof constructor !== 'function') { throw new TypeError(msg(ERROR_MESSAGES.PARENT_NOT_CONSTRUCTOR, 'Parent', 'isAssignableFrom', typeof(constructor))); }
		var cache = nonenum(classdef, '__assignable_from_cache__', {});
		var parentId = classId(constructor);
		if (cache[parentId] == null) {
			cache[parentId] = fallbackIsAssignableFrom(classdef, constructor);
		}
		return cache[parentId];
	}

	/**
	 * Checks to see if an instance is defined to be a child of a parent.
	 *
	 * Theory fail: mixins are not supposed to create an isA relationship, but they do here.
	 * @param instance {Object} An instance object to check.
	 * @param parent {function} A potential parent (see isAssignableFrom).
	 * @returns {boolean} true if this instance has been constructed from something that is assignable from the parent or is null, false otherwise.
	 */
	function isA(instance, parent) {
		if (typeof parent !== 'function') { throw new TypeError(msg(ERROR_MESSAGES.PARENT_NOT_CONSTRUCTOR, 'Parent', 'isA', typeof(parent))); }
		if (instance == null) return false;
		return isAssignableFrom(instance.constructor, parent);
	}

	/** @private */
	function fallbackFulfills(instance, protocol) {
		var requirement = typeof protocol === 'function' ? protocol.prototype : protocol;
		for (var item in requirement) {
			var type = typeof instance[item];
			var required = requirement[item];
			if (type !== typeof required) {
				if (type === 'number' && required === Number) {
					return true;
				} else if (type === 'object' && required === Object) {
					return true;
				} else if (type === 'string' && required === String) {
					return true;
				} else if (type === 'boolean' && required === Boolean) {
					return true;
				}
				return false;
			}
		}
		return true;
	}

	/**
	 * Does duck typing to determine if an instance object implements a protocol.
	 * The protocol may be either an adhoc protocol, in which case it is an object
	 * or it can be a formal protocol in which case it's a function.
	 *
	 * In an adhoc protocol, you can use Number, Object, String and Boolean to indicate
	 * the type required on the instance.
	 *
	 * @param instance {!Object}
	 * @param protocol {function|!Object}
	 * @returns {boolean}
	 */
	function fulfills(instance, protocol) {
		var cache = nonenum(instance, '__fulfills_cache__', {});
		var parentId = classId(protocol);
		if (cache[parentId] == null) {
			cache[parentId] = fallbackFulfills(instance, protocol);
		}
		return cache[parentId];
	}

	/**
	 * Checks that a class provides a prototype that will fulfill a protocol.
	 *
	 * @param classdef {function}
	 * @param protocol {function|!Object}
	 * @returns {boolean}
	 */
	function classFulfills(classdef, protocol) {
		return fulfills(classdef.prototype, protocol);
	}

	// Exporting:
	var methods = {
		'extend': extend,

		// TODO: choose between simple and diamond mixins
		'mixin': simpleMixin,
		'diamondMixin': diamondMixin,

		'implement': implement,
		'isAssignableFrom': isAssignableFrom,
		'isA': isA,
		'fulfills': fulfills,
		'classFulfills': classFulfills
	};

	var exporting = {
		'export': function(to) {
			copy(methods, to || global, true);
		},
		'install': function() {
			copy({
				isA: makeMethod(methods.isA),
				fulfills: makeMethod(methods.fulfills)
			}, Object.prototype, true);
			copy({
				isAssignableFrom: makeMethod(methods.isAssignableFrom),
				implement: makeMethod(methods.implement),
				classFulfills: makeMethod(methods.classFulfills),
				extend: makeMethod(methods.extend),
				mixin: makeMethod(methods.mixin)
			}, Function.prototype, true);
		}
	};
	copy(methods, exporting);

	// not sure if this works in node....
	if ('jasmine' in global) {
		var err = {};
		var getErr = function(key) {
			return function() {
				var message = ERROR_MESSAGES[key];
				var args = Array.prototype.slice.call(arguments);
				args.unshift(message);
				var result = msg.apply(null, args);
				if (result === null) {
					throw new Error("No such error message "+key);
				}
				return result;
			};
		};
		for (var key in ERROR_MESSAGES) {
			err[key] = getErr(key);
		}
		exporting._err = err;
	}

	if ('module' in global) {
		//noinspection JSHint
		module.exports = exporting;
	} else {
		global.topiary = exporting;
	}
})();