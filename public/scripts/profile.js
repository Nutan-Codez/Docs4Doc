$(window).click(function () {
    if (umenu.style.display === "flex") {
        umenu.style.animation = "usermenuhide .1s ease-in-out both";
        setTimeout(function () {
            umenu.style.display = "none";
        }, uMenuDelayInMilliseconds);
    }
});

// open usermenu
var uMenuDelayInMilliseconds = 100;
const umenu = document.getElementById("usermenu");

$('#nb-u-ico').click(function (event) {
    event.stopPropagation();

    if (umenu.style.display === "none" || umenu.style.display == "") {
        umenu.style.display = "flex";
        umenu.style.animation = "usermenushow .1s ease-in-out";
    } else {
        umenu.style.animation = "usermenuhide .1s ease-in-out both";
        setTimeout(function () {
            umenu.style.display = "none";
        }, uMenuDelayInMilliseconds);
    }
});

// open menu
var MenuDelayInMilliseconds = 200;
$('#nav-icon3').click(function (event) {
    event.stopPropagation();

    if ($("#nav-icon3").hasClass('open')) {
        $('#nav-icon3').toggleClass('open');
        $('#menu').css("animation", "menuhide .2s ease-in-out forwards");
        setTimeout(function () {
            $('#menu').css("display", "none");
        }, MenuDelayInMilliseconds);
    } else {
        $('#nav-icon3').toggleClass('open');
        $('#menu').css("display", "flex");
        $('#menu').css("animation", "menushow .2s ease-in-out");
    }
});

$(document).ready(function () {
    var hidden1 = 0;
    $("#showmore1").click(function () {
        if (hidden1 == 0) {
            $(".hidden-links").show();
            $("#showmore1").html("<a class='menu-link-icon'><i class=\"uil uil-angle-up\"></i></a>Show less");
            hidden1 = 1;
        } else {
            $(".hidden-links").hide();
            $("#showmore1").html("<a class='menu-link-icon'><i class=\"uil uil-angle-down\"></i></a>Show more");
            hidden1 = 0;
        }
    });

    $("#showmore2").click(function () {
        if (hidden1 == 0) {
            $(".hidden-links2").show();
            $("#showmore2").html("<a class='menu-link-icon'><i class=\"uil uil-angle-up\"></i></a>Show less");
            hidden1 = 1;
        } else {
            $(".hidden-links2").hide();
            $("#showmore2").html("<a class='menu-link-icon'><i class=\"uil uil-angle-down\"></i></a>Show more");
            hidden1 = 0;
        }
    });
});

$(".username-wrapper").on({
    mouseenter: function () {
        $(".verified").css("opacity", "1");
        $(".verified").css("top", "115%");
    },
    mouseleave: function () {
        $(".verified").css("opacity", "0");
        $(".verified").css("top", "150%");
    }
});
