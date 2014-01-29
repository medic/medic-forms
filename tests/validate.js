
var fs = require('fs'),
    wru = require('wru'),
    _ = require('underscore'),
    util = require('./util/util.js'),
    tests = require('./fixtures/compiled.js'),
    form_validator = require('../lib/validate.js');


/**
 * @name _assert
 */
var _assert = function (_test, _i) {

  var forms = _test.forms;
  var test = 'Test #' + (_i + 1);

  var label = (
    test + ' must ' +
      (_test.valid ? '' : 'not ') + 'validate'
  );

  form_validator.validate_forms(forms,
    wru.async(label, function (_rv) {

      /* Paranoia:
       *   These assertions test the test fixtures. */

      wru.assert(
        test + ' must provide an array for the `forms` property',
          _.isArray(forms)
      );

      /* Check top-level validity:
       *   This is an all-or-nothing result for all form
       *   definitions provided by the current test fixture. */

      wru.assert(label, (_rv.valid === _test.valid));

      /* Check individual form validity:
       *   We only do this if the `all` parameter is present, indicating
       *   that the `valid` property should match the validity of *all*
       *   forms in the test fixture, not just the top-level result. */

      if (_test.all) {

        var detail = _rv.detail;

        wru.assert(
          test + ' must have one detailed result for every form',
            (forms.length == detail.length)
        );

        for (var i = 0, len = detail.length; i < len; ++i) {
          wru.assert(
            label + ' at offset ' + i,
              (detail[i].valid === _test.valid)
          );
        }
      }
    }
  ));
}


/* Start */
return wru.test([
  util.make_test(
    'field-validation', 
    tests.fixtures.validate.fields,
    _assert
  ),
  util.make_test(
    'form-validation', 
    tests.fixtures.validate.forms,
    _assert
  ),
  util.make_test(
    'select-list-validation', 
    tests.fixtures.validate.select_lists,
    _assert
  )
]);

