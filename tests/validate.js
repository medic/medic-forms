
var fs = require('fs'),
    _ = require('underscore'),
    util = require('./util.js'),
    tests = require('./fixtures/compiled.js'),
    form_validator = require('../lib/validate.js');


/**
 * @name _assert
 */
var _assert = function (_test, _fixture, _i) {

  var forms = _fixture.forms;
  var fixture_label = 'Test #' + (_i + 1);

  var label = (
    fixture_label + ' must ' +
      (_fixture.valid ? '' : 'not ') + 'validate'
  );

  form_validator.validate_forms(forms, function (_rv) {

    /* Paranoia:
     *   These assertions test the test fixtures. */

    _test.ok(
      _.isArray(forms),
        fixture_label + ' must provide an array for the `forms` property'
    );

    /* Check top-level validity:
     *   This is an all-or-nothing result for all form
     *   definitions provided by the current test fixture. */

    _test.ok((_rv.valid === _fixture.valid), label);

    /* Check individual form validity:
     *   We only do this if the `all` parameter is present, indicating
     *   that the `valid` property should match the validity of *all*
     *   forms in the test fixture, not just the top-level result. */

    if (_fixture.all) {

      var detail = _rv.detail;

      _test.ok(
        (forms.length == detail.length),
          fixture_label + ' must have one detailed result for every form'
      );

      for (var i = 0, len = detail.length; i < len; ++i) {
        _test.ok(
          (detail[i].valid === _fixture.valid), label
            + ' at offset ' + i
        );
      }
    }

    /* Finished */
    _test.done();
  });
}


/* Tests */
util.make_tests(
  'form-validation', exports,
    tests.fixtures.validate.forms, _assert
);
util.make_tests(
  'field-validation', exports,
    tests.fixtures.validate.fields, _assert
);
util.make_tests(
  'select-list-validation', exports,
    tests.fixtures.validate.select_lists, _assert
);

