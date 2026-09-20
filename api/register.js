```javascript
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    // Get information sent by register.html
    const {
      full_name,
      phone,
      country,
      income,
      loan_purpose
    } = req.body || {};

    // Check required information
    if (
      !full_name ||
      !phone ||
      !country ||
      !income ||
      !loan_purpose
    ) {
      return res.status(400).json({
        error: "Please complete all required fields."
      });
    }

    // Supported countries
    const allowedCountries = ["KE", "UG", "TZ"];

    if (!allowedCountries.includes(country)) {
      return res.status(400).json({
        error: "Unsupported country."
      });
    }

    // Get Supabase credentials from Vercel environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "Supabase environment variables are missing."
      );

      return res.status(500).json({
        error: "Server configuration is incomplete."
      });
    }

    // Insert customer into Supabase
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
          income: income,
          loan_purpose: loan_purpose
        })
      }
    );

    // Read Supabase response
    const responseText =
      await supabaseResponse.text();

    let data;

    try {
      data = responseText
        ? JSON.parse(responseText)
        : null;
    } catch (error) {
      console.error(
        "Supabase returned non-JSON:",
        responseText
      );

      return res.status(500).json({
        error: "Supabase returned an unexpected response."
      });
    }

    // Supabase returned an error
    if (!supabaseResponse.ok) {
      console.error(
        "Supabase error:",
        JSON.stringify(data, null, 2)
      );

      let message =
        "Unable to create customer.";

      if (data?.message) {
        message = data.message;
      } else if (data?.error) {
        message = data.error;
      } else if (data?.hint) {
        message = data.hint;
      }

      return res.status(
        supabaseResponse.status
      ).json({
        error: message
      });
    }

    // Make sure a customer was created
    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {
      return res.status(500).json({
        error:
          "Customer was not returned by Supabase."
      });
    }

    // Successful registration
    return res.status(201).json({
      success: true,
      customer: data[0]
    });

  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Server error."
    });
  }
}
```

