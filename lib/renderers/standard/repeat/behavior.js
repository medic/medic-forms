$(function() {

  function findMaxIndex(list, fieldName) {
    var repeatingRegex = new RegExp('.*' + fieldName + '\\[([0-9]+)\\]');
    var index = -1;
    list.find('li').each( function() {
      var name = $(this).find('input, textarea, select').first().attr('name');
      if (name) {
        var match = repeatingRegex.exec(name);
        if (match) {
          index = Math.max(index, match[1]);
        }
      }
    });
    return index + 1;
  }

  function findFieldName(li) {
    var classes = li.attr('class').split(/\s+/);
    var idPrefix = 'field-id-';
    for (var i = 0; i < classes.length; i++) {
      if (classes[i].indexOf(idPrefix) === 0) {
        return classes[i].substring(idPrefix.length);
      }
    }
    return undefined;
  }

  $( 'body' ).on('click', '.repeat .add-item', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var list = $(e.target).closest('ul');
    var clone = list.find('> li:first-child').clone();
    clone.removeClass('skipped');
    var fieldName = findFieldName(clone);
    var index = findMaxIndex(list, fieldName);
    var newFieldName = fieldName + '[' + index + ']';
    clone.find('input, textarea, select').each( function() {
      var newId = this.id + '-' + index;
      this.id = newId;
      $(this).prev('label').attr('for', newId);

      this.name = this.name.replace(fieldName, newFieldName);
    });
    clone.insertBefore($(e.target).closest('li'));
  });

  $( 'body' ).on('click', '.repeat .delete-item', function(e) {
    e.preventDefault();
    e.stopPropagation();
    $(e.target).closest('li').remove();
  });

});