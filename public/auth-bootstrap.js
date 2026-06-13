(function () {
  try {
    var path = location.pathname.replace(/\/$/, "") || "/";
    var auth = [
      "/dashboard", "/settings", "/wallet", "/messages", "/orders", "/escrow", "/profile",
      "/my-projects", "/my-services", "/applications", "/clients/manage", "/freelancers/manage",
      "/analytics", "/subscription", "/saved", "/checkout", "/promotions", "/portfolio",
      "/services/create", "/projects/create", "/agency", "/ai", "/notifications",
      "/agencies/create", "/revenue", "/admin",
    ];
    var needs = auth.some(function (p) {
      return path === p || path.indexOf(p + "/") === 0;
    });
    if (!needs) return;

    var raw =
      localStorage.getItem("ishbor-session") || sessionStorage.getItem("ishbor-session");
    if (!raw) {
      location.replace("/login?redirect=" + encodeURIComponent(location.pathname));
      return;
    }

    var session = JSON.parse(raw);
    var uid = session.user && session.user.id;
    var role = (session.user && session.user.userType) || "client";
    if (uid) {
      var stored = localStorage.getItem("ishbor-active-role-" + uid);
      if (stored === "client" || stored === "freelancer") role = stored;
    }

    var clientOnly = ["/my-projects", "/projects/create", "/clients/manage", "/analytics/client"];
    var freelancerOnly = [
      "/my-services", "/services/create", "/applications", "/freelancers/manage",
      "/analytics/freelancer", "/promotions", "/dashboard/freelancer",
    ];
    var dash = role === "freelancer" ? "/dashboard/freelancer" : "/dashboard";

    if (
      clientOnly.some(function (p) {
        return path === p || path.indexOf(p + "/") === 0;
      }) &&
      role !== "client"
    ) {
      location.replace(dash);
      return;
    }
    if (
      freelancerOnly.some(function (p) {
        return path === p || path.indexOf(p + "/") === 0;
      }) &&
      role !== "freelancer"
    ) {
      location.replace(dash);
      return;
    }
    if (path.indexOf("/admin") === 0 && !(session.user && session.user.isAdmin)) {
      location.replace(dash);
    }
  } catch (e) {
    /* ignore */
  }
})();
