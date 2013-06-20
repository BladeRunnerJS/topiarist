Topiary
=======

Topiary provides tree and shape-based type verification for JavaScript.

Details
-------

You can see the specification [here](specs), or the git repository [here](https://github.com/caplin/topiary).
Actual js file is at https://github.com/caplin/topiary/blob/gh-pages/lib/topiary.js.


A Note on implementation
------------------------

This library makes liberal use of nonenumerable attributes and Object.getPrototypeOf.
It is therefore suitable only for ecmascript 5 engines.  It will work in ecmascript 6
engines but there would be a much nicer implementation in that case, using Map and
private symbols.
