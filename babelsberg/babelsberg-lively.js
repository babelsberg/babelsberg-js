module('users.timfelgentreff.babelsberg.babelsberg-lively').
requires('lively.morphic.Halos', 'lively.persistence.Serializer').
toRun(function() {
// Lively-specific adaptations for Babelsberg/JS

cop.create('MorphSetConstrainedPositionLayer').refineClass(lively.morphic.Morph, {
    setPosition: function(newPos) {
        if (this.editCb) {
            this.editCb(newPos);
            return this.renderContextDispatch('setPosition', newPos);
        } else {
            return cop.proceed(newPos);
        }
    }
}).refineClass(lively.morphic.DragHalo, {
    dragStartAction: function() {
        this.targetMorph.editCb = bbb.edit(this.targetMorph.getPosition(), ['x', 'y']);
        return cop.proceed.apply(this, arguments);
    },
    dragEndAction: function() {
        this.targetMorph.editCb();
        return cop.proceed.apply(this, arguments);
    }
});


ObjectLinearizerPlugin.subclass('DoNotSerializeConstraintsPlugin',
'plugin interface', {
    ignoreProp: function(obj, key, value) {
        return (key === ConstrainedVariable.AttrName ||
                key === ConstrainedVariable.ThisAttrName ||
                (value instanceof Constraint));
    }
});

ObjectLinearizerPlugin.subclass('SerializeConstraintsPlugin',
'initialization', {
    initialize: function($super) {
        $super();
        // this.weakRefs = [];
        this.constraints = [];
    }
},
'plugin interface', {
    ignoreProp: function(obj, propName, value) {
        var self = this;
        if (propName == ConstrainedVariable.AttrName) {
            Properties.ownValues(value).each(function(constraintVariable) {
                constraintVariable._constraints.each(function(constraint) {
                    if (!(self.constraints.include(constraint))) {
                        self.constraints.push(constraint);
                    }
                });
            });
        }
        return (key === ConstrainedVariable.AttrName ||
                key === ConstrainedVariable.ThisAttrName ||
                (value instanceof Constraint));
    },
    serializationDone: function(registry) {
        alertOK('serialization done');
        var serializer = this.getSerializer();
        this.constraints.each(function(constraint) {
             // oonly store in the first object
            var cvar = constraint.constraintvariables.first();
            var persistentCopy = serializer.getRegisteredObjectFromId(
                serializer.getIdFromObject(cvar.obj)
            );
            if (!persistentCopy.__constraints) {
                persistentCopy.__constraints = [];
            }
            var ctx = {};
            if (!constraint._enabled) return; // only serialize enabled constraints
            if (!constraint._options) {
                console.log('Could not serialize constraint without options.');
                console.log(constraint);
                debugger;
                return;
            }
            Properties.own(constraint._options.ctx).each(function(name) {
                ctx[name] = serializer.getIdFromObject(constraint._options.ctx[name]);
            });
            debugger;
            persistentCopy.__constraints.push({
                isConstraint: true,
                solver: '' + (constraint.solver.constructor.type),
                enabled: constraint._enabled,
                priority: constraint._priority,
                predicate: constraint._predicate.toString(),
                ctx: ctx
            });
        });
    },
    afterDeserializeObj: function(obj) {
        if (obj.__constraints) {
            this.constraints.pushAll(obj.__constraints);
        }
        delete obj.__constraints;
    },
    deserializationDone: function() {
        var serializer = this.getSerializer();
        this.constraints.each(function(constraint) {
            try {
                var solver = new (eval(constraint.solver));
            } catch (e) {
                debugger;
                throw new Error('Could not create solver: ' + constraint.solver);
            }
            // constraint._enabled,
            // constraint._priority,
            // constraint._predicate.toString(),
            var bindings = {};
            try {
                Properties.own(constraint.ctx).each(function(name) {
                    var id = constraint.ctx[name];
                    var obj = serializer.getRecreatedObjectFromId(id);
                    if (id) {
                        var msg = 'Could not recreate constraint, because object ' +
                            name + ' (' + id + ') was not found';
                        throw new Error(msg);
                    }
                    bindings[name] = obj;
                });
                bbb.always(
                    {ctx: bindings, solver: solver},
                    eval('(' + constraint.predicate + ')')
                );
            } catch (e) {
                console.log('Could not reinstall constraint: ' + e);
            }
        }, this);
    },
    additionallySerialize: function(obj, persistentCopy) {
        return;
        // 1. Save persistentCopy for future manipulation
        this.weakRefs.forEach(function(ea) {
            alertOK('ok');
            if (ea.obj === obj) {
                ea.objCopy = persistentCopy;
            }

            // we maybe reached an object, which was marked weak?
            // alertOK("all " + this.weakRefs.length)
            if (ea.value === obj) {
                // var source = this.getSerializer().register(ea.obj);
                var ref = this.getSerializer().register(ea.value);
                source[ea.propName];
                alertOK('got something:' + ea.propName + ' -> ' + printObject(ref));
                ea.objCopy[ea.propName] = ref;
            }
        }, this);
    }
});

Object.extend(SerializeConstraintsPlugin, {
     cleanObject: function(obj, visited, exclude) {
         if (!visited) {
             visited = new Map();
             // visited.set($world, true)
             visited.set(window, true);
         }
         exclude = exclude || ['owner'];
         if (visited.get(obj)) return 0;
         visited.set(obj, true);
         var sum = 0;
         Properties.own(obj).each(function(prop) {
             if (exclude.include(prop)) return;
             var value = obj[prop];
             sum += this.cleanObject(value, visited, exclude);
         }, this);
         try {
             if (obj.__constraints) {
                 console.log('visit ' + obj);
             }
         } catch (e) {}
         return sum + 1;
     }
});

lively.persistence.pluginsForLively.push(DoNotSerializeConstraintsPlugin);
// lively.persistence.pluginsForLively.remove(DoNotSerializeConstraintsPlugin)

// if (!lively.persistence.pluginsForLively.include(SerializeConstraintsPlugin))
//      lively.persistence.pluginsForLively.push(SerializeConstraintsPlugin);

// lively.persistence.pluginsForLively.remove(SerializeConstraintsPlugin)

});
