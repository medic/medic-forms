
var fs = require('fs'),
    _ = require('underscore'),
    util = require('./include/util.js'),
    fixtures = require('./fixtures/compiled.js'),
    form_validator = require('../lib/validate.js');


/**
 * @name _assert
 */
var _assert = function (_test, _fixture) {

  var forms = _fixture.forms;
  var label = 'must ' + (_fixture.valid ? '' : 'not ') + 'validate';

  /* Paranoia:
   *   These assertions test the test fixtures. */
  _test.ok(
    _.isArray(forms), 'must provide an array for the `forms` property'
  );

  form_validator.validate_forms(forms, function (_rv) {

    /* Check top-level validity:
     *   This is an all-or-nothing result for all form
     *   definitions provided by the current test fixture. */

    _test.equal(_rv.valid, _fixture.valid, label);

    /* Check individual form validity:
     *   We only do this if the `all` parameter is present, indicating
     *   that the `valid` property should match the validity of *all*
     *   forms in the test fixture, not just the top-level result. */

    if (_fixture.all) {

      var detail = _rv.detail;

      _test.equal(
        forms.length, detail.length,
          'must have one detailed result for every form'
      );

      for (var i = 0, len = detail.length; i < len; ++i) {
        _test.equal(
          detail[i].valid, _fixture.valid, label + ' at offset ' + i
        );
      }
    }

    /* Finished */
    _test.done();
  });
}


/* Tests */
util.make_tests(
  'forms', exports,
    fixtures.validate.forms, _assert
);
util.make_tests(
  'fields', exports,
    fixtures.validate.fields, _assert
);
util.make_tests(
  'select-lists', exports,
    fixtures.validate.select_lists, _assert
);

