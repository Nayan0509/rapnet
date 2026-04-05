
// ===== RAPAPORT INTEGRATION ==== //
// Replace with your keys
const RAP_CLIENT_ID = "lJiqAAaCsfkH97OSRXfBDQp0WZsiF0B4";
const RAP_CLIENT_SECRET = "knN-AA3OUzNgpTlPN8HRBxV8f-8eibCoYF6m3WQfVot8wb51f5C0PbDcHgVcM2Gv";

// Token can be cached for 8 hours
async function getRapaportToken() {
  const cached = localStorage.getItem("rapToken");
  const expiry = localStorage.getItem("rapTokenExpiry");

  if (cached && expiry && Date.now() < parseInt(expiry)) {
    return cached;
  }

  const res = await fetch("https://authztoken.api.rapaport.com/api/get", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: RAP_CLIENT_ID,
      client_secret: RAP_CLIENT_SECRET
    })
  });

  const data = await res.json();
  const token = data?.token;

  // Store for 7.5 hours
  localStorage.setItem("rapToken", token);
  localStorage.setItem("rapTokenExpiry", (Date.now() + 7.5 * 60 * 60 * 1000));

  return token;
}

async function getDiamonds(filters = {}) {
  const token = await getRapaportToken();

  const defaultBody = {
    search_type: "White",
    shapes: ["Round"],
    labs: ["GIA"],
    size_from: "0.2",
    size_to: "0.5",
    clarity_from: "IF",
    clarity_to: "SI3",
    color_from: "D",
    color_to: "K",
    page_number: "1",
    page_size: "20"
  };

  const body = {
    request: {
      body: Object.assign(defaultBody, filters)
    }
  };

  const res = await fetch(
    "https://technet.rapnetapis.com/instant-inventory/api/Diamonds",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify(body)
    }
  );

  return await res.json();
}
