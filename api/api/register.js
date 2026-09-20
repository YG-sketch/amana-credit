```javascript
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      full_name,
      phone,
      country,
      income,
      loan_purpose
    } = req.body || {};

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

    const supabaseResponse = await fetch(
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
          country: country,
          income: income || null,
          loan_purpose: loan_purpose || null
        })
      }
    );

    // Read as text first so a non-JSON Supabase response
    // does not crash the API.
    const responseText = await supabaseResponse.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Supabase returned non-JSON:", responseText);

      return res.status(500).json({
        error: "Supabase returned an unexpected response.",
        details: responseText.substring(0, 300)
      });
    }

    if (!supabaseResponse.ok) {
      console.error("Supabase error:", data);

      return res.status(supabaseResponse.status).json({
        error: data?.message || data?.hint || "Unable to create customer."
      });
    }

    return res.status(201).json({
      success: true,
      customer: data[0]
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      error: error.message || "Server error."
    });
  }
}
```
