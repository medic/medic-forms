var util = require('../../util.js');

$(function() {

  /**
   * @name findMaxIndex:
   */
  function findMaxIndex (list, fieldName) {

    var index = -1;
    var repeatingRegex = new RegExp(
      '.*' + util.escapeRegex(fieldName) + '\\[([0-9]+)\\]'
    );

    list.find('li').each(function () {

      var selector = 'input, textarea, select';
      var name = $(this).find(selector).first().attr('name');

      if (name) {
        var match = repeatingRegex.exec(name);
        if (match) {
          index = Math.max(index, match[1]);
        }
      }
    });

    return (index + 1);
  }


  /**
   * @name findFieldName:
   */
  function findFieldName (li) {

    var classes = li.attr('class').split(/\s+/);
    var idPrefix = 'field-id-';

    for (var i = 0; i < classes.length; i++) {
      if (classes[i].indexOf(idPrefix) === 0) {
        return classes[i].substring(idPrefix.length);
      }
    }

    return undefined;
  }


  /**
   * @name initialize:
   */
  function initialize () {

    $('body .repeat .template')
      .find('input, select, textarea')
      .prop('disabled', true);

    $('body').on('click', '.repeat .add-item', function (e) {

      e.preventDefault();
      e.stopPropagation();

      var list = $(e.target).closest('ul');
      var clone = list.find('> .template').clone();

      clone.removeClass('template');

      var fieldName = findFieldName(clone);
      var index = findMaxIndex(list, fieldName);
      var newFieldName = fieldName + '[' + index + ']';

      clone.find('input, textarea, select').each(function () {

        var newId = this.id + '-' + index;
        this.id = newId;
        this.name = this.name.replace(fieldName, newFieldName);
        $(this).prev('label').attr('for', newId);
        $(this).prop('disabled', false);

      });

      clone.insertBefore($(e.target).closest('li'));
    });

    $('body').on('click', '.repeat .delete-item', function (e) {
      e.preventDefault();
      e.stopPropagation();
      $(e.target).closest('li').remove();
    });
  }


  /* Start */
  return initialize();
});
