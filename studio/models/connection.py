"""Connection & Tool database models."""

from sqlalchemy import Column, String, Text, JSON, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship

from studio.models.base import Base, TimestampMixin, new_id


class Connection(Base, TimestampMixin):
    __tablename__ = "connections"

    id = Column(String(32), primary_key=True, default=new_id)
    workspace_id = Column(String(32), nullable=False, index=True, default="default")
    name = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False)  # openapi | database | document
    config = Column(JSON, default=dict)
    status = Column(String(20), default="active")  # active | error | disabled

    tools = relationship("Tool", back_populates="connection", cascade="all, delete-orphan")


class Tool(Base, TimestampMixin):
    __tablename__ = "tools"

    id = Column(String(32), primary_key=True, default=new_id)
    connection_id = Column(String(32), ForeignKey("connections.id"), nullable=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, default="")
    parameters_schema = Column(JSON, default=dict)  # JSON Schema
    required_permissions = Column(JSON, default=list)
    rate_limit = Column(String(50), nullable=True)
    implementation = Column(String(50), default="http")  # http | sql | python | retrieval
    implementation_config = Column(JSON, default=dict)
    enabled = Column(Boolean, default=True)

    connection = relationship("Connection", back_populates="tools")
