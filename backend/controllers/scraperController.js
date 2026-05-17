const axios = require('axios');

// Extracts the problem slug from a LeetCode URL.
// Handles formats like:
//   https://leetcode.com/problems/two-sum/
//   https://leetcode.com/problems/two-sum/description/
const extractSlug = (url) => {
  try {
    const match = url.match(/leetcode\.com\/problems\/([^/]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

// POST /api/scrape/leetcode
// Body: { url: "https://leetcode.com/problems/two-sum/" }
// Returns: { title, difficulty, tags }
const scrapeLeetCode = async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ message: 'A LeetCode problem URL is required' });
  }

  const slug = extractSlug(url);
  if (!slug) {
    return res.status(400).json({ message: 'Could not parse a valid problem slug from the URL' });
  }

  // LeetCode's public GraphQL API — no authentication required for problem metadata
  const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        title
        difficulty
        topicTags {
          name
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      LEETCODE_GRAPHQL,
      { query, variables: { titleSlug: slug } },
      {
        headers: {
          'Content-Type': 'application/json',
          // LeetCode requires a Referer header to accept GraphQL requests
          Referer: `https://leetcode.com/problems/${slug}/`,
        },
        timeout: 8000, // 8-second hard limit
      }
    );

    const question = response.data?.data?.question;

    if (!question) {
      return res.status(404).json({
        message: 'Problem not found on LeetCode. Check the URL and try again.',
      });
    }

    res.json({
      title: question.title,
      difficulty: question.difficulty,
      // Flatten the tag objects into a plain string array
      tags: question.topicTags.map((t) => t.name),
    });
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ message: 'LeetCode API timed out — try again shortly' });
    }
    if (error.response?.status === 403) {
      return res.status(503).json({
        message: 'LeetCode blocked the request. Try adding the details manually.',
      });
    }
    res.status(500).json({ message: 'Failed to fetch problem data from LeetCode' });
  }
};

module.exports = { scrapeLeetCode };
