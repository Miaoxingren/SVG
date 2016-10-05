(function(window) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        radius = (width < 2 * radius) ? width / 2 : (height < 2 * radius) ? height / 2 : radius;
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
        return this;
    };
    
    var lynx = lynx || {};
    lynx.init = function(dom) {
        if (!dom) {
            console.error('Dom does not exist.');
            return;
        }
        if (!dom.width || !dom.height) {
            console.error("Dom’s width & height should be ready before init.");
            return;
        }
        var treemap = new Treemap(dom);
        return treemap;
    };

    function Treemap(dom) {
        this._dom = dom;
        this._ctx = dom.getContext('2d');
        this._opt;
        this._styles = {
            parent: {
                textStyle: {
                    fontStyle: 'normal',
                    fontWeight: 'normal',
                    fontSize: '14px',
                    fontFamily: 'sans-serif',
                    textAlign: 'left',
                    textBaseline: 'middle',
                    textColor: '#000',
                    offsetX: 10
                },
                rectStyle: {
                    borderRadius: 0,
                    fillColor: 'transparent',
                    strokeColor: '#F6F6F6',
                    lineWidth: 1,
                    lineJoin: 'miter'
                }
            },
            child: {
                textStyle: {
                    fontStyle: 'normal',
                    fontWeight: 'normal',
                    fontSize: '14px',
                    fontFamily: 'sans-serif',
                    textAlign: 'left',
                    textBaseline: 'middle',
                    textColor: '#000',
                    offsetX: 10
                },
                rectStyle: {
                    borderRadius: 0,
                    fillColor: 'transparent',
                    strokeColor: '#F6F6F6',
                    lineWidth: 1,
                    lineJoin: 'miter'
                }
            }
        };
        this._outer = {
            x: 0,
            y: 0,
            width: 300,
            height: 300,
            layout: 'none',
            paddingX: 10,
            paddingY: 10
        };
        this._setOption = function(option) {
            var root = option.root;
            this._initRoot(root);
            this._generate(root);
        };
        this._setOuter = function(obj) {
            var outer = this._outer;
            outer.x = obj.x;
            outer.y = obj.y;
            outer.width = obj.width;
            outer.height = obj.height;
            outer.layout = obj.layout || 'none';
            outer.paddingX = obj.paddingX || outer.paddingX;
            outer.paddingY = obj.paddingY || outer.paddingY;
        };
        this._textStyle = function(textStyle) {
            var ctx = this._ctx;
            ctx.font = textStyle.fontStyle + ' ' + textStyle.fontWeight + ' ' + textStyle.fontSize + ' ' + textStyle.fontFamily;
            ctx.textAlign = textStyle.textAlign;
            ctx.textBaseline = textStyle.textBaseline;
            ctx.fillStyle = textStyle.textColor;
        };
        this._rectStyle = function(rectStyle) {
            var ctx = this._ctx;
            ctx.lineJoin = rectStyle.lineJoin;
            ctx.lineWidth = rectStyle.lineWidth;
            ctx.fillStyle = rectStyle.fillColor;
            ctx.strokeStyle = rectStyle.strokeColor;
        };
        this._inheritStyle = function(parent, child) {
            if (!parent.textStyle || !child.textStyle || !parent.rectStyle || !child.rectStyle) {
                console.error('Text style or rect style is not defined.');
                return;
            }
            var textStyle = angular.extend({}, parent.textStyle, child.textStyle);
            var rectStyle = angular.extend({}, parent.rectStyle, child.rectStyle);
            return {
                textStyle: textStyle,
                rectStyle: rectStyle
            }
        };
        this._initRoot = function(root) {
            root.x = 0;
            root.y = 0;
            root.width = this._dom.width;
            root.height = this._dom.height;
            root.layout = root.layout || 'none';
            root.paddingX = root.paddingX || this._outer.paddingX;
            root.paddingY = root.paddingY || this._outer.paddingY;
        };
        this._generate = function(obj) {
            if (!obj || !obj.children) {
                return;
            }
            this._setOuter(obj);
            this._styles.parent = this._inheritStyle(this._styles.parent, {
                rectStyle: obj.rectStyle || {},
                textStyle: obj.textStyle || {}
            });
            var prevStyle = angular.extend({}, this._styles.parent);
            var areas = this._runLayout(obj, this._outer);
            var branches = obj.children;
            for (var i = 0, branch, area;
                (branch = branches[i]) && (area = areas[i]); i++) {
                branch.x = area.x;
                branch.y = area.y;
                branch.width = area.width;
                branch.height = area.height;

                this._generate(branch);
                this._styles.parent = prevStyle;
            }
        };
        this._runLayout = function(obj, outer) {
            if (outer.layout === 'vertical') {
                return this._runVerticalLayout(obj, outer);
            } else if (outer.layout === 'horizontal') {
                return this._runHorizontalLayout(obj, outer);
            } else {
                return this._runNoLayout(obj);
            }
        };
        this._runNoLayout = function(obj) {
            var areas = [];
            for (var i = 0, child; child = obj.children[i]; i++) {
                var rect = {
                    label: child.label,
                    x: child.x,
                    y: child.y,
                    width: child.width,
                    height: child.height
                }
                areas.push(rect);
                this._styles.child = this._inheritStyle(this._styles.parent, {
                    rectStyle: child.rectStyle || {},
                    textStyle: child.textStyle || {}
                });
                this._drawRect(rect);
            }
            return areas;
        };
        this._runVerticalLayout = function(obj, outer) {
            var areas = [];
            var count = obj.children.length;
            var outerWidth = outer.width;
            var outerHeight = outer.height;
            var paddingX = outer.paddingX;
            var paddingY = outer.paddingY;
            var width = outerWidth - paddingX * 2;
            var height = (outerHeight - (count + 1) * paddingY) / count;
            if (width < paddingX) {
                paddingX = outerWidth / 4;
                width = paddingX * 2;
            }
            if (height < paddingY) {
                paddingY = outerHeight / (3 * count + 1);
                height = paddingY * 2;
            }
            var start = {
                x: outer.x + paddingX,
                y: outer.y + paddingY
            };
            for (var i = 0, child; child = obj.children[i]; i++) {
                var x = child.width ? (outerWidth - child.width) / 2 : start.x;
                var y = start.y + (height + paddingY) * i;
                var rect = {
                    label: child.label,
                    x: x,
                    y: y,
                    width: child.width || width,
                    height: height
                }
                areas.push(rect);
                this._styles.child = this._inheritStyle(this._styles.parent, {
                    rectStyle: child.rectStyle || {},
                    textStyle: child.textStyle || {}
                });
                this._drawRect(rect);
            }
            return areas;
        };
        this._runHorizontalLayout = function(obj, outer) {
            var areas = [];
            var count = obj.children.length;
            var outerWidth = outer.width;
            var outerHeight = outer.height;
            var paddingX = outer.paddingX;
            var paddingY = outer.paddingY;
            var width = (outerWidth - (count + 1) * paddingX) / count;
            var height = outerHeight - paddingY * 2;
            if (width < paddingX) {
                paddingX = outerWidth / (3 * count + 1);
                width = paddingX * 2;
            }
            if (height < paddingY) {
                paddingY = outerHeight / 4;
                height = paddingY * 2;
            }
            var start = {
                x: outer.x + paddingX,
                y: outer.y + paddingY
            };
            for (var i = 0, child; child = obj.children[i]; i++) {
                var x = start.x + (width + paddingX) * i;
                var y = child.height ? (outerHeight - child.height) / 2 : start.y;
                var rect = {
                    label: child.label,
                    x: x,
                    y: y,
                    height: child.height || height,
                    width: width
                }
                areas.push(rect);
                this._styles.child = this._inheritStyle(this._styles.parent, {
                    rectStyle: child.rectStyle || {},
                    textStyle: child.textStyle || {}
                });
                this._drawRect(rect);
            }
            return areas;
        };
        this._drawRect = function(obj) {
            if (!(obj.x && obj.y && obj.width && obj.height)) {
                console.error("Rect's position or size should be defined.");
                return;
            }
            if (obj.x + obj.width > this._dom.width || obj.y + obj.height > this._dom.height) {
                console.error("Rect is out of canvas.");
                return;
            }
            var ctx = this._ctx;
            this._rectStyle(this._styles.child.rectStyle);
            if (obj.rectStyle && obj.rectStyle.borderRadius && obj.rectStyle.borderRadius > 0) {
                ctx.roundRect(obj.x, obj.y, obj.width, obj.height, obj.rectStyle.borderRadius);
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
            }
            this._showLabel(obj);
        };
        this._showLabel = function(obj) {
            if (!obj || !obj.label) {
                return;
            }
            var ctx = this._ctx;
            this._textStyle(this._styles.child.textStyle);
            var x = ctx.textAlign === 'center' ? (obj.x + obj.width / 2) : obj.x + this._styles.text.offsetX;
            var y = obj.y + obj.height / 2;
            ctx.fillText(obj.label, x, y);
        };
    };

    var treemapProto = Treemap.prototype;

    treemapProto.setOption = function(option) {
        if (!option || !option.root) {
            console.error("Option with root should be ready before set.");
            return;
        }
        this._opt = option;
        this._setOption(option);
    };
    treemapProto.getOption = function() {
        return this._opt;
    }
    
    window.lynx = lynx;
})(window);

var canvasModule = angular.module('canvas', []);
canvasModule.controller('canvasCtrl', ['$scope', '$timeout', function($scope, $timeout) {
    $scope.model = {
        id: "canvas",
        width: 500,
        height: 500
    };
    var option = {
        root: {
            layout: 'vertical',
            paddingX: 15,
            paddingY: 15,
            label: 'label',
            textStyle: {
                textAlign: 'center'
            },
            rectStyle: {
                fillColor: 'black'
            },
            children: [{
                layout: 'vertical',
                paddingX: 20,
                paddingY: 20,
                rectStyle: {
                    borderRadius: 5,
                    fillColor: 'red'
                },
                children: [{
                    label: "m1.1",
                    rectStyle: {
                        borderRadius: 10
                    },
                }, {
                    label: "m1.2"
                }]
            }, {
                paddingX: 5,
                paddingY: 5,
                layout: 'vertical',
                children: [{
                    layout: 'horizontal',
                    rectStyle: {
                        fillColor: 'blue'
                    },
                    children: [{
                        label: 'm2.1.1'
                    }, {
                        label: 'm2.1.2'
                    }, {
                        label: 'm2.1.3'
                    }]
                }, {
                    label: 'm2.2',
                    width: 100
                }, {
                    layout: 'horizontal',
                    children: [{
                        label: 'm2.3.1'
                    }, {
                        label: 'm2.3.1'
                    }]
                }]
            }, {
                width: 420,
                label: 'm3',
                children: [{
                    x: 50,
                    y: 50,
                    width: 50,
                    height: 50
                }]
            }]
        }
    };
    $timeout(function() {
        var treemap = lynx.init(document.getElementById($scope.model.id));
        treemap.setOption(option);
    }, 10);
}]);
