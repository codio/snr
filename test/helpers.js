// Helpers
// -------

exports.streamToString = function (s, cb) {
  var result = [];
  s.on('data', function (data) {
    result.push(data.toString());
  });
  s.on('end', function () {
    cb(null, result.join(''));
  });
  s.on('error', function (error) {
    cb(error);
  });
};

exports.emptyStream = function () {
  var s = new stream.Readable();
  s._read = function () {};
  return s;
};

exports.emptyWriteStream = function () {
  var s = new stream.Writable();
  s._write = function () {};
  return s;
};
