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

    var session;
    try {
      session = JSON.parse(raw);
    } catch (e) {
      localStorage.removeItem("ishbor-session");
      sessionStorage.removeItem("ishbor-session");
      location.replace("/login?redirect=" + encodeURIComponent(fullPath));
      return;
    }

    if (!session || !session.user || !session.user.id || !session.user.email) {
      localStorage.removeItem("ishbor-session");
      sessionStorage.removeItem("ishbor-session");
      location.replace("/login?redirect=" + encodeURIComponent(fullPath));
      return;
    }

    var uid = session.user.id;
    var role = session.user.userType || "client";
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
  } catch (e) {
    /* ignore */
  }
})();
