export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { full_name, phone, country } = req.body || {};

    if (!full_name || !phone || !country) {
      return res.status(400).json({
        error: "Full name, phone number and country are required."
      });
    }

    const allowedCountries = ["KE", "UG", "TZ"];

    if (!allowedCountries.includes(country)) {
      return res.status(400).json({
        error: "Unsupported country."
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: "Server configuration is incomplete."
      });
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/customers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          full_name: full_name.trim(),
          phone: phone.trim(),
          country
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Supabase error:", data);

      return res.status(500).json({
        error: "Unable to create customer."
      });
    }

    return res.status(201).json({
      success: true,
      customer: data[0]
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      error: "Server error."
    });
  }
}
