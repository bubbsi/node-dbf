'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _events = require('events');

var _header = require('./header');

var _header2 = _interopRequireDefault(_header);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Parser = function (_EventEmitter) {
    _inherits(Parser, _EventEmitter);

    function Parser(filename, options) {
        _classCallCheck(this, Parser);

        var _this = _possibleConstructorReturn(this, (Parser.__proto__ || Object.getPrototypeOf(Parser)).call(this));

        _this.filename = filename;
        _this.options = options || {};
        _this.encoding = _this.options.encoding || 'utf-8';
        return _this;
    }

    _createClass(Parser, [{
        key: 'parse',
        value: function parse() {
            var _this2 = this;

            this.emit('start', this);

            this.header = new _header2.default(this.filename, this.encoding);
            this.header.parse(function (err) {

                if(err){
                    _this2.emit('error', err);
                    return;
                }

                _this2.emit('header', _this2.header);

                var sequenceNumber = 0;

                var loc = _this2.header.start;
                var bufLoc = _this2.header.start;
                var overflow = null;
                _this2.paused = false;

                var stream = _fs2.default.createReadStream(_this2.filename);

                _this2.readBuf = function () {

                    var buffer = void 0;
                    if (_this2.paused) {
                        _this2.emit('paused');
                        return;
                    }

                    while (buffer = stream.read()) {
                        if (bufLoc !== _this2.header.start) {
                            bufLoc = 0;
                        }
                        if (overflow !== null) {
                            buffer = overflow + buffer;
                        }

                        while (loc < _this2.header.start + _this2.header.numberOfRecords * _this2.header.recordLength && bufLoc + _this2.header.recordLength <= buffer.length) {
                            _this2.emit('record', _this2.parseRecord(++sequenceNumber, buffer.slice(bufLoc, bufLoc += _this2.header.recordLength)));
                        }

                        loc += bufLoc;
                        if (bufLoc < buffer.length) {
                            overflow = buffer.slice(bufLoc, buffer.length);
                        } else {
                            overflow = null;
                        }

                        return _this2;
                    }
                };

                stream.on('readable', _this2.readBuf);
                return stream.on('end', function () {
                    return _this2.emit('end');
                });
            });

            return this;
        }
    }, {
        key: 'pause',
        value: function pause() {
            return this.paused = true;
        }
    }, {
        key: 'resume',
        value: function resume() {
            this.paused = false;
            this.emit('resuming');
            return this.readBuf();
        }
    }, {
        key: 'parseRecord',
        value: function parseRecord(sequenceNumber, buffer) {
            var _this3 = this;

            var record = {
                '@sequenceNumber': sequenceNumber,
                '@deleted': [42, '*'].includes(buffer.slice(0, 1)[0])
            };

            var loc = 1;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = Array.from(this.header.fields)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var field = _step.value;

                    (function (field) {
                        return record[field.name] = _this3.parseField(field, buffer.slice(loc, loc += field.length));
                    })(field);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return record;
        }
    }, {
        key: 'parseField',
        value: function parseField(field, buffer) {
            var value = buffer.toString(this.encoding).trim();

            if (field.type === 'C') {
                // Character
                value = value;
            } else if (field.type === 'F') {
                // Floating Point
                value = value === +value && value === (value | 0) ? parseInt(value, 10) : parseFloat(value, 10);
            } else if (field.type == 'L') {
                // Logical
                switch (value) {
                    case ['Y', 'y', 'T', 't'].includes(value):
                        value = true;
                        break;
                    case ['N', 'n', 'F', 'f'].includes(value):
                        value = false;
                        break;
                    default:
                        value = null;
                }
            } else if (field.type === 'M') {
                // Memo
                value = value;
            } else if (field.type === 'N') {
                // Numeric
                value = value === +value && value === (value | 0) ? parseInt(value) : parseFloat(value, 10);
            }

            return value;
        }
    }]);

    return Parser;
}(_events.EventEmitter);

exports.default = Parser;
