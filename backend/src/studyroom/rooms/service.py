"""自习室模块 — 业务逻辑层。"""

from __future__ import annotations

from typing import Optional

from bedrock.database import db

from .entities import RoomCreate, RoomMemberResponse, RoomResponse
from .exc import InvalidInviteCode, NotRoomOwner, RoomFull, RoomNotFound, UserAlreadyInRoom, UserNotInRoom
from .models import MAX_ROOM_SIZE, Room, RoomMember


class RoomService:
    """房间业务逻辑。"""

    def create_room(self, data: RoomCreate, owner_id: int) -> RoomResponse:
        """创建自习室。"""
        max_members = min(data.max_members, MAX_ROOM_SIZE)
        with db.session_scope() as session:
            room = Room(
                name=data.name,
                max_members=max_members,
                owner_id=owner_id,
            )
            session.add(room)
            session.flush()

            member = RoomMember(
                room_id=room.id,
                user_id=owner_id,
                status="focusing",
            )
            session.add(member)
            session.flush()

            return RoomResponse(
                id=room.id,
                name=room.name,
                invite_code=room.invite_code,
                max_members=room.max_members,
                owner_id=room.owner_id,
                is_active=room.is_active,
                created_at=room.created_at,
                member_count=1,
            )

    def join_room(self, invite_code: str, user_id: int) -> RoomResponse:
        """通过邀请码加入自习室（已是成员则直接返回房间信息）。"""
        with db.session_scope() as session:
            room = session.query(Room).filter_by(invite_code=invite_code, is_active=True).first()
            if room is None:
                raise InvalidInviteCode()

            existing = (
                session.query(RoomMember)
                .filter_by(room_id=room.id, user_id=user_id)
                .first()
            )
            if existing is not None:
                # 已是成员，直接返回房间信息（允许多端重连）
                member_count = (
                    session.query(RoomMember).filter_by(room_id=room.id).count()
                )
                return RoomResponse(
                    id=room.id,
                    name=room.name,
                    invite_code=room.invite_code,
                    max_members=room.max_members,
                    owner_id=room.owner_id,
                    is_active=room.is_active,
                    created_at=room.created_at,
                    member_count=member_count,
                )

            # 检查是否在其他房间有活跃连接
            other_member = (
                session.query(RoomMember)
                .filter_by(user_id=user_id)
                .first()
            )
            if other_member is not None:
                if other_member.status == "offline":
                    session.delete(other_member)
                    session.flush()
                else:
                    raise UserAlreadyInRoom()

            member_count = (
                session.query(RoomMember).filter_by(room_id=room.id).count()
            )
            if member_count >= room.max_members:
                raise RoomFull()

            member = RoomMember(
                room_id=room.id,
                user_id=user_id,
                status="focusing",
            )
            session.add(member)
            session.flush()

            return RoomResponse(
                id=room.id,
                name=room.name,
                invite_code=room.invite_code,
                max_members=room.max_members,
                owner_id=room.owner_id,
                is_active=room.is_active,
                created_at=room.created_at,
                member_count=member_count + 1,
            )

    def leave_room(self, room_id: int, user_id: int) -> None:
        """退出自习室（删除成员记录）。"""
        with db.session_scope() as session:
            member = (
                session.query(RoomMember)
                .filter_by(room_id=room_id, user_id=user_id)
                .first()
            )
            if member is not None:
                session.delete(member)

    def update_member_status(self, room_id: int, user_id: int, status: str) -> None:
        """更新成员状态到数据库。"""
        with db.session_scope() as session:
            member = (
                session.query(RoomMember)
                .filter_by(room_id=room_id, user_id=user_id)
                .first()
            )
            if member is not None:
                member.status = status

    def get_room(self, room_id: int) -> RoomResponse:
        """获取房间信息。"""
        with db.session_scope() as session:
            room = session.query(Room).filter_by(id=room_id).first()
            if room is None or not room.is_active:
                raise RoomNotFound()

            member_count = (
                session.query(RoomMember).filter_by(room_id=room.id).count()
            )
            return RoomResponse(
                id=room.id,
                name=room.name,
                invite_code=room.invite_code,
                max_members=room.max_members,
                owner_id=room.owner_id,
                is_active=room.is_active,
                created_at=room.created_at,
                member_count=member_count,
            )

    def get_room_members(self, room_id: int) -> list[RoomMemberResponse]:
        """获取房间成员列表。"""
        with db.session_scope() as session:
            room = session.query(Room).filter_by(id=room_id, is_active=True).first()
            if room is None:
                raise RoomNotFound()

            members = session.query(RoomMember).filter_by(room_id=room_id).all()
            return [
                RoomMemberResponse(
                    user_id=m.user_id,
                    status=m.status,
                    joined_at=m.joined_at,
                )
                for m in members
            ]

    def get_my_rooms(self, user_id: int) -> list[RoomResponse]:
        """获取用户创建和加入的房间列表。"""
        with db.session_scope() as session:
            results = []

            # 用户创建的房间
            owned = session.query(Room).filter_by(owner_id=user_id, is_active=True).all()
            for room in owned:
                cnt = session.query(RoomMember).filter_by(room_id=room.id).count()
                results.append(RoomResponse(
                    id=room.id,
                    name=room.name,
                    invite_code=room.invite_code,
                    max_members=room.max_members,
                    owner_id=room.owner_id,
                    is_active=room.is_active,
                    created_at=room.created_at,
                    member_count=cnt,
                ))

            # 用户加入的房间（非自己创建的）
            member_records = (
                session.query(RoomMember).filter_by(user_id=user_id).all()
            )
            joined_ids = {m.room_id for m in member_records}
            for rid in joined_ids:
                room = session.query(Room).filter_by(id=rid, is_active=True).first()
                if room is None or room.owner_id == user_id:
                    continue
                cnt = session.query(RoomMember).filter_by(room_id=room.id).count()
                results.append(RoomResponse(
                    id=room.id,
                    name=room.name,
                    invite_code=room.invite_code,
                    max_members=room.max_members,
                    owner_id=room.owner_id,
                    is_active=room.is_active,
                    created_at=room.created_at,
                    member_count=cnt,
                ))

            return results

    def delete_room(self, room_id: int, user_id: int) -> None:
        """删除房间（仅房主）。级联删除所有成员记录。"""
        with db.session_scope() as session:
            room = session.query(Room).filter_by(id=room_id, is_active=True).first()
            if room is None:
                raise RoomNotFound()
            if room.owner_id != user_id:
                raise NotRoomOwner()
            session.query(RoomMember).filter_by(room_id=room_id).delete()
            session.delete(room)

    def kick_member(self, room_id: int, owner_id: int, target_user_id: int) -> None:
        """踢出成员（仅房主）。"""
        with db.session_scope() as session:
            room = session.query(Room).filter_by(id=room_id, is_active=True).first()
            if room is None:
                raise RoomNotFound()
            if room.owner_id != owner_id:
                raise NotRoomOwner()
            if owner_id == target_user_id:
                raise NotRoomOwner()  # 不能踢自己
            member = (
                session.query(RoomMember)
                .filter_by(room_id=room_id, user_id=target_user_id)
                .first()
            )
            if member is None:
                raise UserNotInRoom()
            session.delete(member)

    def is_member(self, room_id: int, user_id: int) -> bool:
        """检查用户是否属于该房间。"""
        with db.session_scope() as session:
            return (
                session.query(RoomMember)
                .filter_by(room_id=room_id, user_id=user_id)
                .first()
                is not None
            )

    def is_owner(self, room_id: int, user_id: int) -> bool:
        """检查用户是否为房主。"""
        with db.session_scope() as session:
            room = session.query(Room).filter_by(id=room_id).first()
            return room is not None and room.owner_id == user_id


room_service = RoomService()
