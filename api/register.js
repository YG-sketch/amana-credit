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

    // Validate required fields
    if (!full_name || !phone || !country || !income || !loan_purpose) {
      return res.status(400).json({
        error: "Please complete all required fields."
      });
    }

    // Only allow supported countries
    const allowedCountries = ["KE", "UG", "TZ"];

    if (!allowedCountries.includes(country)) {
      return res.status(400).json({
        error: "Unsupported country."
      });
    }

    // Get Supabase environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: "Server configuration is incomplete."
      });
    }

    // Send customer to Supabase
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
    const responseText = await supabaseResponse.text();

    let data = null;

    try {
      data = responseText
        ? JSON.parse(responseText)
        : null;
    } catch (parseError) {
      console.error(
        "Supabase returned non-JSON:",
        responseText
      );

      return res.status(500).json({
        error: "Supabase returned an invalid response.",
        details: responseText.substring(0, 500)
      });
    }

    // Supabase rejected the request
    if (!supabaseResponse.ok) {

      console.error(
        "Supabase status:",
        supabaseResponse.status
      );

      console.error(
        "Supabase response:",
        JSON.stringify(data, null, 2)
      );

      let supabaseMessage = "Unable to create customer.";

      if (data) {

        if (typeof data === "string") {
          supabaseMessage = data;
        }

        else if (data.message) {
          supabaseMessage = data.message;
        }

        else if (data.error) {
          supabaseMessage = data.error;
        }

        else if (data.hint) {
          supabaseMessage = data.hint;
        }

        else {
          supabaseMessage = JSON.stringify(data);
        }
      }

      return res.status(supabaseResponse.status).json({
        error: supabaseMessage
      });
    }

    // Make sure Supabase returned a customer
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(500).json({
        error: "Customer was not returned by Supabase."
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
      error: error.message || "Server error."
    });
  }
}
