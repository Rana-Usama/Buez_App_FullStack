export const getPagesAndIGAccount = async (accessToken) => {
  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`);
    const json = await res.json();
    console.log("/me/accounts Response:", JSON.stringify(json, null, 2));
    if (!json?.data || json?.data.length === 0) {
      throw new Error("No Facebook Pages found.");
    }
    const page = json.data.find((p) => p.instagram_business_account);
    if (!page) {
      throw new Error("No Instagram Business account connected to your Pages.");
    }
    const igId = page.instagram_business_account.id;
    const igRes = await fetch(`https://graph.facebook.com/v18.0/${igId}?fields=username,profile_picture_url&access_token=${page.access_token}`);
    const igData = await igRes.json();
    return {
      page_id: page.id,
      page_name: page.name,
      page_token: page.access_token,
      ig_profile: igData,
    };
  } catch (error) {
    console.log("Error:", error.message);
    throw error;
  }
};
