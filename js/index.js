(function(window) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) {
            r = w / 2;
        }
        if (h < 2 * r) {
            r = h / 2;
        }
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    }
    var treemap = {};
    treemap.defaults = {
        textStyle: {
            fontStyle: 'normal',
            fontWeight: 'normal',
            fontSize: '12px',
            fontFamily: 'sans-serif',
            textAlign: 'left',
            textBaseline: 'middle',
            textColor: '#666'
        },
        rectStyle: {
            borderRadius: 0,
            fillColor: '#EEE',
            strokeStyle: '#0F0',
            lineWidth: '5',
            lineJoin: 'round'
        }
    };
    treemap.outer = {
        x: 0,
        y: 0,
        width: 300,
        height: 300,
        layout: 'none',
        padding: {
            x: 10,
            y: 10
        }
    };
    treemap.init = function(dom) {
        if (!dom) {
            console.error('Dom not exists!');
        }
        if (!dom.width || !dom.height) {
            console.error("Dom's width and height not defined");
        }
        treemap.dom = dom;
        treemap.ctx = dom.getContext('2d');
        treemap.textStyle();
        treemap.rectStyle();
    };
    treemap.textStyle = function(textStyle) {
        var defaults = treemap.defaults.textStyle;
        var option = textStyle ? angular.extend(textStyle, defaults) : defaults;
        var ctx = treemap.ctx;
        ctx.font = option.fontStyle + ' ' + option.fontWeight + ' ' + option.fontSize + ' ' + option.fontFamily;
        ctx.textAlign = option.textAlign;
        ctx.textBaseline = option.textBaseline;
        treemap.defaults.textStyle.textColor = option.textColor;
    };
    treemap.rectStyle = function(rectStyle) {
        var defaults = treemap.defaults.rectStyle;
        var option = rectStyle ? angular.extend(rectStyle, defaults) : defaults;
        var ctx = treemap.ctx;
        ctx.strokeStyle = option.strokeStyle;
        ctx.lineWidth = option.lineWidth;
        ctx.lineJoin = option.lineJoin;
        treemap.defaults.rectStyle.fillColor = option.fillColor;
    };
    treemap.padding = function(padding) {
        if (padding && padding.x && padding.y) {
            treemap.outer.padding = padding;
        }
        return treemap.outer.padding;
    }
    treemap.setOption = function(option) {
        if (!option) {
            return;
        }
        var root = option.root;
        root.x = 0;
        root.y = 0;
        root.width = treemap.dom.width;
        root.height = treemap.dom.height;
        treemap.generate(root);
    };
    treemap.generate = function(obj) {
        if (!obj || !obj.children) {
            return;
        }
        treemap.outer.x = obj.x;
        treemap.outer.y = obj.y;
        treemap.outer.width = obj.width;
        treemap.outer.height = obj.height;
        treemap.outer.layout = obj.layout || 'none';
        obj.padding && treemap.padding(obj.padding);
        var areas = treemap.runLayout(obj, treemap.outer);
        var branches = obj.children;
        for (var i = 0, branch, area;
            (branch = branches[i]) && (area = areas[i]); i++) {
            branch.x = area.x;
            branch.y = area.y;
            branch.width = area.width;
            branch.height = area.height;
            // treemap.outer.x = area.x;
            // treemap.outer.y = area.y;
            // treemap.outer.width = area.width;
            // treemap.outer.height = area.height;
            // treemap.outer.layout = child.layout || 'none';
            // child.padding && treemap.padding(child.padding);
            // treemap.runLayout(child, treemap.outer);
            treemap.generate(branch);
        }
    }
    treemap.setStyle = function(obj) {
        var ctx = treemap.ctx;
        obj.textStyle && treemap.textStyle(obj.textStyle);
        obj.rectStyle && treemap.rectStyle(obj.rectStyle);
    };
    treemap.runLayout = function(obj, outer) {
        treemap.setStyle(obj);
        if (outer.layout === 'vertical') {
            return treemap.runVerticalLayout(obj, outer);
        } else if (outer.layout === 'horizontal') {
            return treemap.runHorizontalLayout(obj, outer);
        } else {
            return treemap.runNoLayout(obj);
        }
    };
    treemap.drawRect = function(obj) {
        var ctx = treemap.ctx;
        if (obj.x && obj.y && obj.width && obj.height) {
            if (obj.borderRadius && obj.borderRadius > 0) {
                ctx.lineWidth = 5;
                ctx.fillStyle = "red";
                ctx.strokeStyle = "black";
                ctx.roundRect(obj.x, obj.y, obj.width, obj.height, obj.borderRadius);
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.fillStyle = treemap.defaults.rectStyle.fillColor;
                ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
            }
        } else {
            console.error("Rect's position or size not defined");
        }
        treemap.showLabel(obj);
    };
    treemap.showLabel = function(obj) {
        var ctx = treemap.ctx;
        var x = ctx.textAlign === 'center' ? (obj.x + obj.width / 2) : obj.x;
        var y = obj.y + obj.height / 2;
        ctx.fillStyle = treemap.defaults.textStyle.textColor;
        ctx.fillText(obj.label, x + 10, y);
    }
    treemap.runNoLayout = function(obj) {
        var areas = [];
        for (var i = 0, child; child = obj.children[i]; i++) {
            var rect = {
                label: child.label,
                x: child.x,
                y: child.y,
                width: child.width,
                height: child.height,
                borderRadius: child.borderRadius || 0
            }
            areas.push(rect);
            treemap.setStyle(obj);
            treemap.drawRect(rect);
        }
        return areas;
    };
    treemap.runVerticalLayout = function(obj, outer) {
        var areas = [];
        var count = obj.children.length;
        var outerWidth = outer.width;
        var outerHeight = outer.height;
        var paddingX = outer.padding.x;
        var paddingY = outer.padding.y;
        if (outerWidth - paddingX * 2 < 0) {
            paddingX = outerWidth / 3;
        }
        if ((outerHeight - (count + 1) * paddingY) / count < 0) {
            paddingY = outerHeight / (2 * count + 1);
        }
        var width = outerWidth - paddingX * 2;
        var height = (outerHeight - (count + 1) * paddingY) / count;
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
                height: height,
                borderRadius: child.borderRadius || 0
            }
            areas.push(rect);
            treemap.setStyle(obj);
            treemap.drawRect(rect);
        }
        return areas;
    };
    treemap.runHorizontalLayout = function(obj, outer) {
        var areas = [];
        var count = obj.children.length;
        var outerWidth = outer.width;
        var outerHeight = outer.height;
        var paddingX = outer.padding.x;
        var paddingY = outer.padding.y;
        if (outerHeight - paddingY * 2) {
            paddingY = outerHeight / 3;
        }
        if ((outerWidth - (count + 1) * paddingX) / count < 0) {
            paddingX = outerWidth / (2 * count + 1);
        }
        var height = outerHeight - paddingY * 2;
        var width = (outerWidth - (count + 1) * paddingX) / count;
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
                width: width,
                borderRadius: child.borderRadius || 0
            }
            areas.push(rect);
            treemap.setStyle(obj);
            treemap.drawRect(rect);
        }
        return areas;
    };
    window.treemap = treemap;
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
            label: 'label',
            textStyle: {
                textAlign: 'center'
            },
            padding: {
                x: 10,
                y: 10
            },
            children: [{
                x: 50,
                y: 50,
                width: 460,
                height: 50,
                label: 'm1',
                layout: 'vertical',
                borderRadius: 5,
                padding: {
                    x: 10,
                    y: 10
                },
                children: [{
                    x: 100,
                    label: "m1.1"
                }, {
                    x: 100,
                    label: "m1.2"
                }]
            }, {
                x: 50,
                y: 50,
                width: 460,
                height: 50,
                label: 'm2',
                layout: 'vertical',
                children: [{
                    label: 'm2.1',
                    layout: 'horizontal',
                    children: [{
                        label: 'm2.1.1'
                    }, {
                        label: 'm2.1.1'
                    }, {
                        label: 'm2.1.1'
                    }]
                }, {
                    label: 'm2.2',
                    width: 100
                }, {
                    label: 'm2.3',
                    layout: 'horizontal',
                    children: [{
                        label: 'm2.3.1'
                    }, {
                        label: 'm2.3.1'
                    }]
                }]
            }, {
                x: 50,
                y: 50,
                width: 460,
                height: 50,
                label: 'm3'
            }]
        }
    };
    $timeout(function() {
        treemap.init(document.getElementById($scope.model.id));
        treemap.setOption(option);
    }, 10);
}]);
