(function () {
  try {
    var path = location.pathname.replace(/\/$/, "") || "/";
    var fullPath = path + location.search;
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
      location.replace("/login?redirect=" + encodeURIComponent(fullPath));
      return;
    }

    var session = JSON.parse(raw);
    var uid = session.user && session.user.id;
    var role = (session.user && session.user.userType) || "client";
    if (uid) {
      var stored = localStorage.getItem("ishbor-active-role-" + uid);
      if (stored === "client" || stored === "freelancer" || stored === "agency") role = stored;
    }

    var clientOnly = ["/my-projects", "/projects/create", "/clients/manage", "/analytics/client", "/checkout"];
    var freelancerOnly = [
      "/my-services", "/services/create", "/applications", "/freelancers/manage",
      "/analytics/freelancer", "/dashboard/freelancer", "/portfolio/create", "/portfolio/edit", "/promotions",
    ];
    var agencyOnly = ["/dashboard/agency", "/agency", "/agencies/edit"];
    var dash =
      role === "freelancer" ? "/dashboard/freelancer" : role === "agency" ? "/dashboard/agency" : "/dashboard";

    if (
      agencyOnly.some(function (p) {
        return path === p || path.indexOf(p + "/") === 0;
      }) &&
      role !== "agency"
    ) {
      location.replace(dash);
      return;
    }
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
    if (path === "/portfolio" && role !== "freelancer") {
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
