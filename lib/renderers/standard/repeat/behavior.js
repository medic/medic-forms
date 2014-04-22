$(function() {

  var repeatingRegex = /(.+)\[([0-9]+)\]$/;

  function findMaxIndex(list) {
    var index = -1;
    list.find('li').each( function() {
      var name = $(this).find('input, textarea, select').first().attr('name');
      if (name) {
        var match = repeatingRegex.exec(name);
        if (match) {
          index = Math.max(index, match[2]);
        }
      }
    });
    return index + 1;
  }

  $( 'body' ).on('click', '.repeat .add-item', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var list = $(e.target).closest('ul');
    var clone = list.find('li:first-child').clone();
    var index = findMaxIndex(list);
    clone.find('input, textarea, select').each( function() {
      var newId = this.id + '-' + index;
      this.name += '[' + index + ']';
      this.id = newId;
      $(this).prev('label').attr('for', newId);
    });
    clone.insertBefore($(e.target).closest('li'));
  });

  $( 'body' ).on('click', '.repeat .delete-item', function(e) {
    e.preventDefault();
    e.stopPropagation();
    $(e.target).closest('li').remove();
  });

});