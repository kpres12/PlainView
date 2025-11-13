"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2025-11-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create flow_metrics table
    op.create_table('flow_metrics',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('flow_rate_lpm', sa.Float(), nullable=False),
        sa.Column('pressure_pa', sa.Integer(), nullable=False),
        sa.Column('temperature_c', sa.Float(), nullable=False),
        sa.Column('viscosity', sa.Float(), nullable=True),
        sa.Column('timestamp', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create flow_anomalies table
    op.create_table('flow_anomalies',
        sa.Column('id', sa.String(length=256), nullable=False),
        sa.Column('type', sa.String(length=64), nullable=False),
        sa.Column('severity', sa.String(length=32), nullable=False),
        sa.Column('detected_at', sa.String(length=64), nullable=False),
        sa.Column('metrics', sa.JSON(), nullable=True),
        sa.Column('expected_range', sa.JSON(), nullable=True),
        sa.Column('actual_value', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create valve_actuations table
    op.create_table('valve_actuations',
        sa.Column('id', sa.String(length=256), nullable=False),
        sa.Column('valve_id', sa.String(length=128), nullable=False),
        sa.Column('requested_at', sa.String(length=64), nullable=False),
        sa.Column('completed_at', sa.String(length=64), nullable=True),
        sa.Column('torque_nm', sa.Float(), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=False),
        sa.Column('duration', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create leak_detections table
    op.create_table('leak_detections',
        sa.Column('id', sa.String(length=256), nullable=False),
        sa.Column('severity', sa.String(length=32), nullable=False),
        sa.Column('location', sa.JSON(), nullable=False),
        sa.Column('volume_estimate', sa.Float(), nullable=True),
        sa.Column('detected_at', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create missions table
    op.create_table('missions',
        sa.Column('id', sa.String(length=256), nullable=False),
        sa.Column('name', sa.String(length=256), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.String(length=64), nullable=False),
        sa.Column('started_at', sa.String(length=64), nullable=True),
        sa.Column('completed_at', sa.String(length=64), nullable=True),
        sa.Column('objectives', sa.JSON(), nullable=True),
        sa.Column('assets', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create incidents table
    op.create_table('incidents',
        sa.Column('id', sa.String(length=256), nullable=False),
        sa.Column('title', sa.String(length=512), nullable=False),
        sa.Column('severity', sa.String(length=32), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('started_at', sa.String(length=64), nullable=False),
        sa.Column('resolved_at', sa.String(length=64), nullable=True),
        sa.Column('affected_modules', sa.JSON(), nullable=True),
        sa.Column('detection_ids', sa.JSON(), nullable=True),
        sa.Column('alert_ids', sa.JSON(), nullable=True),
        sa.Column('root_cause', sa.String(length=1024), nullable=True),
        sa.Column('resolution', sa.String(length=1024), nullable=True),
        sa.Column('timeline', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('incidents')
    op.drop_table('missions')
    op.drop_table('leak_detections')
    op.drop_table('valve_actuations')
    op.drop_table('flow_anomalies')
    op.drop_table('flow_metrics')
