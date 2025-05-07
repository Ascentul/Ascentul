# WordPress Reviews Integration

This document describes the public reviews API endpoint for WordPress integration.

## Overview

The `/api/public-reviews` endpoint provides a CORS-enabled, WordPress-friendly way to access approved user reviews from the Ascentul platform. This endpoint returns only reviews that are both public and approved, in a simplified format suitable for display on the WordPress site.

## Endpoint Details

- **URL**: `/api/public-reviews`
- **Method**: GET
- **Authentication**: None required (public endpoint)
- **CORS Support**: Enabled (`Access-Control-Allow-Origin: *`)

## Response Format

The endpoint returns an array of review objects with the following properties:

```json
[
  {
    "id": 123,
    "name": "User Name",
    "rating": 5,
    "body": "Review content text",
    "date": "2025-05-06T21:21:16.496Z"
  }
]
```

### Fields

- `id`: Unique identifier for the review
- `name`: Name of the reviewer (falls back to "Verified User" if no name available)
- `rating`: Review rating (1-5 scale)
- `body`: Review content text
- `date`: ISO-formatted date string when the review was created

## Implementation

The endpoint uses the following logic:

1. Retrieves reviews from the database with proper filtering:
   - Only includes reviews with `isPublic = true`
   - Only includes reviews with `status = "approved"`
2. Joins with the users table to get reviewer names
3. Formats the data for the WordPress site
4. Sorts reviews by createdAt date in descending order (newest first)
5. Returns properly formatted JSON with appropriate CORS headers

## Usage Example

### WordPress JavaScript

```javascript
fetch('https://app.ascentul.com/api/public-reviews')
  .then(response => response.json())
  .then(reviews => {
    // Display reviews on WordPress site
    const reviewsContainer = document.querySelector('#customer-reviews');
    reviews.forEach(review => {
      reviewsContainer.innerHTML += `
        <div class="review">
          <h3>${review.name} <span class="stars">${'★'.repeat(review.rating)}</span></h3>
          <p>${review.body}</p>
          <small>Posted on ${new Date(review.date).toLocaleDateString()}</small>
        </div>
      `;
    });
  })
  .catch(error => console.error('Error fetching reviews:', error));
```

## Error Handling

If the database query fails, the endpoint returns a 500 status code with an error message:

```json
{
  "error": "Failed to fetch reviews",
  "message": "An error occurred while retrieving reviews"
}
```

## Security Considerations

- The endpoint only exposes approved reviews marked as public
- No sensitive user information is exposed (only name, not email or other data)
- The endpoint is read-only, preventing any modification of review data