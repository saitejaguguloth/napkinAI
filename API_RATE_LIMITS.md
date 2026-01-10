# 🔑 API Rate Limits & Quota Management

## ⚠️ Current Issue

You're seeing this error:
```
Gemini Flash error: quota exceeded
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests
Limit: 20 requests per day
```

This means you've hit **Gemini's free tier daily limit of 20 requests**.

## 📊 Understanding Gemini API Limits

### Free Tier
- **20 requests per day** to Gemini 2.5 Flash
- Resets every 24 hours
- Free forever
- Good for: Testing, small projects

### Paid Tier (Pay-as-you-go)
- **1,500+ requests per minute**
- Much higher daily limits
- ~$0.075 per 1,000 input tokens
- ~$0.30 per 1,000 output tokens
- Good for: Production apps

## ✅ Solutions

### Option 1: Wait for Quota Reset ⏰
**Time:** 24 hours from your first request today

**How to check when it resets:**
1. Go to [Google AI Studio Usage](https://ai.dev/rate-limit)
2. View your current usage and reset time
3. Set a reminder

**Temporary fix:**
- Wait until tomorrow
- Use the app sparingly (20 requests = ~5-10 generations)

### Option 2: Upgrade to Paid Tier ⭐ **RECOMMENDED**
**Cost:** ~$0.01 - $0.05 per generation (very cheap!)

**Steps:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click on your API key
3. Enable billing (requires credit card)
4. Choose "Pay as you go"
5. No changes needed to your code - same API key works!

**Benefits:**
- 1,500 RPM (requests per minute)
- Much higher daily limits
- Better for development
- Still very affordable

### Option 3: Add Caching (Advanced) 🔧
Cache similar requests to reduce API calls.

I can implement this if you want, but it requires Redis or similar.

### Option 4: Use Multiple API Keys (Temporary)
**Not recommended**, but possible:
1. Create multiple Google accounts
2. Get a free API key from each
3. Rotate between them in your .env

## 🛠️ Immediate Actions

### 1. Check Your Current Usage
```bash
# Visit this URL (replace with your API key)
https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY
```

Or go to: https://ai.dev/rate-limit

### 2. Monitor Your Requests
Each generation uses **~3-4 API calls**:
1. Layout analysis (1 call)
2. Scaffold generation (1 call)
3. Styling pass (1 call)
4. Sometimes file packaging (1 call)

So with 20 requests/day, you can do **~5-6 generations** before hitting the limit.

### 3. Optimize Your Testing
To conserve your quota while testing:

**Save your generations:**
- Click "Save" after each generation
- Reuse saved projects instead of regenerating
- Export code and test locally

**Use the "Start Fresh" button wisely:**
- Only clear when you really need to
- Modify existing projects with voice/chat instead

**Test edits, not generations:**
- Once you have a generated page, use the left panel to edit it
- Edits use the `/api/edit` endpoint (separate quota)

## 📈 Recommended Approach

### For Development
1. **Upgrade to paid tier** ($5-10/month estimated)
2. Set a budget alert in Google Cloud Console
3. Monitor usage weekly

### For Production
1. **Definitely use paid tier**
2. Implement request caching
3. Add user rate limiting (per user, per day)
4. Monitor costs and usage

## 💰 Cost Estimation

### Development (Testing)
- ~50 generations per day
- ~150-200 API calls
- **Cost: ~$0.50 - $2.00 per day**
- Monthly: ~$15 - $60

### Light Production (100 users)
- ~100 generations per day
- ~300-400 API calls
- **Cost: ~$1 - $5 per day**
- Monthly: ~$30 - $150

### Heavy Production (1000+ users)
- ~1,000 generations per day
- ~3,000-4,000 API calls
- **Cost: ~$10 - $50 per day**
- Monthly: ~$300 - $1,500
- Consider caching to reduce by 50-70%

## 🔧 What I've Done

I've updated the error handling to show better messages:

### Before:
```
Gemini Flash error: { "error": { "code": 429, ... } }
```

### After:
```
⚠️ Daily API quota exceeded. Your Gemini API free tier allows 20 requests/day. 
Please wait 24 hours or upgrade your API key.
```

## 📝 Next Steps

### Immediate (Today):
1. **Wait 24 hours** for quota reset, OR
2. **Upgrade to paid tier** (recommended)

### Short-term (This Week):
1. Set up billing alerts in Google Cloud
2. Monitor your usage at https://ai.dev/rate-limit
3. Optimize generation prompts (already done!)

### Long-term (Production):
1. Implement request caching
2. Add user-based rate limiting
3. Consider batching requests
4. Monitor costs and optimize

## 🔗 Useful Links

- **Check Usage:** https://ai.dev/rate-limit
- **API Keys:** https://aistudio.google.com/app/apikey
- **Pricing:** https://ai.google.dev/pricing
- **Quotas:** https://ai.google.dev/gemini-api/docs/rate-limits
- **Billing Setup:** https://console.cloud.google.com/billing

## 💡 Tips to Conserve Quota

1. **Save everything**: Don't regenerate, save and modify
2. **Use voice/text editing**: Chat edits don't count toward generation quota
3. **Export and test locally**: Download the code and test in your browser
4. **Plan your generations**: Sketch first, then generate once
5. **Batch test**: Make a list of what you want to test, then do it all at once

## ✅ TL;DR

**Problem:** Hit 20 requests/day free tier limit

**Solution:** 
- **Wait:** 24 hours (free)
- **Upgrade:** $5-10/month for unlimited (recommended)
- **Optimize:** Save projects, use edits instead of regenerating

**Cost:** Very cheap (~$0.01-0.05 per generation on paid tier)

---

**Ready to continue?** Either wait for the reset or upgrade your API key, then click "Start Fresh" to test the new generation quality! 🚀
