var win = $(window);
var doc = $(document);
var body = $(document.body);

// Enables CSS transitions after load to prevent initial transitions
doc.ready(function() {
    body.removeClass("preload");

    var slide = 0, speed = 0, scroll = win.scrollTop();
    win.bind('scroll', function(e) {
        var newScroll = win.scrollTop();
        scroll = scroll || newScroll;
        speed += Math.pow((newScroll - scroll) * 0.027, 2);
        scroll = newScroll;
    });

    var updateBackground = function() {
        var newSpeed = Math.floor(speed);
        if (newSpeed > 0) {
            slide += newSpeed;
            speed = speed * 0.97;
            body.css('background-position-x', -slide);
        }
        window.requestAnimationFrame(updateBackground);
    };
    updateBackground();

    var name = $('#login-name');
    var register = $('#login-register');
    var submit = $('#login-submit');
    register.change(function() {
        var checked = register.prop('checked');
        name.prop('required', checked).closest('.form-group').toggleClass('hide', !checked);
        submit.text(checked ? 'Sign up' : 'Sign in');
    });
});
