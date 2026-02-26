# Fragment Block

Includes content from another page as an inline fragment. This is a standard AEM Edge Delivery block from the [block collection](https://www.aem.live/developer/block-collection/fragment).

## Configuration

The block accepts a single cell containing a link (or plain text path) to the fragment page.

| Field | Description |
|-------|-------------|
| Fragment URL | Path to the fragment content page (e.g., `/fragments/header-nav`) |

## Behavior

1. Fetches the fragment's `.plain.html` representation
2. Rebases relative media paths (`./media_*`) to the fragment's origin path
3. Decorates and loads all sections within the fragment
4. Replaces the block's content with the loaded fragment

## Error Handling

If the path is invalid (empty, protocol-relative, or doesn't start with `/`) or the fetch fails, the block renders nothing.
