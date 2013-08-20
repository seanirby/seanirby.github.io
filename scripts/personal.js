$(document).ready( function(){
  $(".project-additional-info").hide()
  $("div.project-container").hover(

    function(){
      $(this).find(".project-additional-info").slideDown();
    },

    function(){
      $(this).find(".project-additional-info").slideUp();
    }
  );
});