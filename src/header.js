'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Header = function () {
    function Header(filename, encoding) {
        _classCallCheck(this, Header);

        this.filename = filename;
        this.encoding = encoding || 'utf-8';
    }

    _createClass(Header, [{
        key: 'parse',
        value: function parse(callback) {
            var _this = this;

            _fs2.default.readFile(this.filename, function (err, buffer) {
                if (err) {
                    callback(err);
                    return;
                }

                _this.type = buffer.slice(0, 1).toString(_this.encoding);
                _this.dateUpdated = _this.parseDate(buffer.slice(1, 4));
                _this.numberOfRecords = _this.convertBinaryToInteger(buffer.slice(4, 8));
                _this.start = _this.convertBinaryToInteger(buffer.slice(8, 10));
                _this.recordLength = _this.convertBinaryToInteger(buffer.slice(10, 12));

                var result = [];
                for (var i = 32, end = _this.start - 32; i <= end; i += 32) {
                    result.push(buffer.slice(i, i + 32));
                }

                _this.fields = result.map(_this.parseFieldSubRecord.bind(_this));

                callback(_this);
            });
        }
    }, {
        key: 'parseDate',
        value: function parseDate(buffer) {
            var year = 1900 + this.convertBinaryToInteger(buffer.slice(0, 1));
            var month = this.convertBinaryToInteger(buffer.slice(1, 2)) - 1;
            var day = this.convertBinaryToInteger(buffer.slice(2, 3));

            return new Date(year, month, day);
        }
    }, {
        key: 'parseFieldSubRecord',
        value: function parseFieldSubRecord(buffer) {
            return {
                name: buffer.slice(0, 11).toString(this.encoding).replace(/[\u0000]+$/, ''),
                type: buffer.slice(11, 12).toString(this.encoding),
                displacement: this.convertBinaryToInteger(buffer.slice(12, 16)),
                length: this.convertBinaryToInteger(buffer.slice(16, 17)),
                decimalPlaces: this.convertBinaryToInteger(buffer.slice(17, 18))
            };
        }
    }, {
        key: 'convertBinaryToInteger',
        value: function convertBinaryToInteger(buffer) {
            return buffer.readIntLE(0, buffer.length);
        }
    }]);

    return Header;
}();

exports.default = Header;
