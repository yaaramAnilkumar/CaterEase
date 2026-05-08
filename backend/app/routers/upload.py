from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.routers.deps import require_admin
from app.core.config import settings

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/image", dependencies=[Depends(require_admin)])
async def upload_image(file: UploadFile = File(...)):
    if not all([settings.CLOUDINARY_CLOUD_NAME, settings.CLOUDINARY_API_KEY, settings.CLOUDINARY_API_SECRET]):
        raise HTTPException(
            status_code=400,
            detail="Image upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env",
        )

    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, and GIF images are allowed")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB")

    from app.services.cloudinary_service import upload_image as cloudinary_upload
    url = cloudinary_upload(contents, folder="caterease/dishes")
    return {"url": url}
