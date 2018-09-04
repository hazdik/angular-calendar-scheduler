import { Component, Input, Output, EventEmitter, TemplateRef, OnInit, ViewChild, ElementRef, Renderer2, AfterViewInit } from '@angular/core';
import {
    SchedulerViewDay,
    SchedulerViewHour,
    SchedulerViewHourSegment,
    CalendarSchedulerEvent
} from './calendar-scheduler-view.component';
import {
    isSameDay,
    differenceInMinutes
} from 'date-fns';

// WORKAROUND: https://github.com/dherges/ng-packagr/issues/217#issuecomment-339460255
import * as momentImported from 'moment';
const moment = momentImported;

/**
 * [mwlCalendarTooltip]="event.title | calendarEventTitle:'weekTooltip':event"
 * [tooltipPlacement]="tooltipPlacement"
 */
/**
 * [class.cal-starts-within-segment]="!event.startsBeforeSegment"
 * [class.cal-ends-within-segment]="!event.endsAfterSegment"
 *
 * <mwl-calendar-scheduler-event-title *ngIf="!event.startsBeforeSegment"
 *     [event]="event"
 *     view="week">
 * </mwl-calendar-scheduler-event-title>
 * <mwl-calendar-scheduler-event-content *ngIf="!event.startsBeforeSegment"
 *     [event]="event">
 * </mwl-calendar-scheduler-event-content>
 * <mwl-calendar-scheduler-event-actions [event]="event" *ngIf="showActions && event.isClickable && !event.endsAfterSegment"></mwl-calendar-scheduler-event-actions>
 * <mwl-calendar-scheduler-event-actions [event]="event" *ngIf="showActions && event.isDisabled && !event.endsAfterSegment"></mwl-calendar-scheduler-event-actions>
 */
@Component({
    selector: 'calendar-scheduler-event',
    template: `
        <ng-template #defaultTemplate>
            <div #calEvent
                class="cal-scheduler-event"
                [title]="title"
                [class.cal-starts-within-segment]="true"
                [class.cal-ends-within-segment]="true"
                [class.hovered]="event.isHovered"
                [class.cal-disabled]="event.isDisabled || segment.isDisabled"
                [class.cal-not-clickable]="!event.isClickable"
                [style.backgroundColor]="event.color.primary"
                [ngClass]="event?.cssClass"
                (mwlClick)="eventClicked.emit({event: event})"
                (mouseenter)="highlightEvent()"
                (mouseleave)="unhighlightEvent()">
                <calendar-scheduler-event-title
                    [event]="event"
                    view="week">
                </calendar-scheduler-event-title>
                <calendar-scheduler-event-content
                    [event]="event">
                </calendar-scheduler-event-content>
                <calendar-scheduler-event-actions [event]="event" *ngIf="showActions && event.isClickable"></calendar-scheduler-event-actions>
                <calendar-scheduler-event-actions [event]="event" *ngIf="showActions && event.isDisabled"></calendar-scheduler-event-actions>
            </div>
        </ng-template>
        <ng-template
            [ngTemplateOutlet]="customTemplate || defaultTemplate"
            [ngTemplateOutletContext]="{
                day: day,
                hour: hour,
                segment: segment,
                event: event,
                tooltipPlacement: tooltipPlacement,
                showActions: showActions,
                customTemplate: customTemplate,
                eventClicked: eventClicked
            }">
        </ng-template>
    `,
    host: {
        'class': 'cal-scheduler-event-container'
    }
})
export class CalendarSchedulerEventComponent implements OnInit, AfterViewInit {
    @ViewChild('calEvent') eventRef: ElementRef;

    @Input() title: string;

    @Input() day: SchedulerViewDay;

    @Input() hour: SchedulerViewHour;

    @Input() segment: SchedulerViewHourSegment;

    @Input() event: CalendarSchedulerEvent;

    @Input() tooltipPlacement: string;

    @Input() showActions: boolean = true;

    @Input() customTemplate: TemplateRef<any>;

    @Input() container: HTMLDivElement;

    @Input() hourSegments: number = 2;

    @Output() eventClicked: EventEmitter<{ event: CalendarSchedulerEvent }> = new EventEmitter<{ event: CalendarSchedulerEvent }>();

    constructor(private renderer: Renderer2) {   }

    public ngOnInit(): void {
        this.segment.hasBorder = this.hour.hasBorder = true; // !this.event.endsAfterSegment;

        this.title = moment(this.event.start).format('dddd L');

        this.checkEnableState();
    }

    public ngAfterViewInit(): void {
        setTimeout(() => {
            const segmentDurationInMinutes: number = 60 / this.hourSegments;
            const segmentsInEvent: number = differenceInMinutes(this.event.start, this.event.end) / segmentDurationInMinutes;
            this.renderer.setStyle(this.eventRef.nativeElement, 'height', `${this.container.clientHeight * segmentsInEvent}px`);
        }, 0);
    }

    private checkEnableState(): void {
        if (this.segment.isDisabled) {
            this.day.hours.forEach((hour: SchedulerViewHour) => {
                hour.segments.forEach((segment: SchedulerViewHourSegment) => {
                    segment.events.filter((event: CalendarSchedulerEvent) => event.id === this.event.id && isSameDay(event.start, this.event.start))
                        .forEach((event: CalendarSchedulerEvent) => {
                            event.isDisabled = true;
                        });
                });
            });
        }
    }

    highlightEvent(): void {
        // let events: CalendarSchedulerEvent[] = this.day.hours
        //    .filter(h => h.segments.some(s => s.events.some(e => e.id === this.event.id)))
        //    .map(h =>
        //        h.segments.map(s =>
        //            s.events.filter(e => e.id === this.event.id)
        //        ).reduce((prev, curr) => prev.concat(curr))
        //    )
        //    .reduce((prev, curr) => prev.concat(curr));

        this.day.hours.forEach((hour: SchedulerViewHour) => {
            hour.segments.forEach((segment: SchedulerViewHourSegment) => {
                segment.events.filter((event: CalendarSchedulerEvent) => event.id === this.event.id && isSameDay(event.start, this.event.start))
                    .forEach((event: CalendarSchedulerEvent) => {
                        event.isHovered = true;
                    });
            });
        });
    }

    unhighlightEvent(): void {
        this.day.hours.forEach((hour: SchedulerViewHour) => {
            hour.segments.forEach((segment: SchedulerViewHourSegment) => {
                segment.events.filter((event: CalendarSchedulerEvent) => event.id === this.event.id && isSameDay(event.start, this.event.start))
                    .forEach((event: CalendarSchedulerEvent) => {
                        event.isHovered = false;
                    });
            });
        });
    }

    // private sameEventInPreviousHour(day: SchedulerViewDay, hour: SchedulerViewHour): CalendarSchedulerEvent {
    //    let hourIndex: number = day.hours.indexOf(hour);
    //    let previousHour = day.hours[hourIndex - 1];
    //    if (previousHour) {
    //        let previousSegment: SchedulerViewHourSegment = previousHour.segments[previousHour.segments.length - 1];
    //        return previousSegment.events[previousSegment.events.length - 1];
    //    }
    //    return null;
    // }

    // private sameEventInPreviousSegment(segmentIndex: number): CalendarSchedulerEvent {
    //    let previousSegment: SchedulerViewHourSegment = this.hour.segments[segmentIndex - 1];
    //    if (previousSegment) {
    //        return previousSegment.events[previousSegment.events.length - 1];
    //    }
    //    return null;
    // }

    // private sameEventInNextHour(): CalendarSchedulerEvent {
    //    let hourIndex: number = this.day.hours.indexOf(this.hour);
    //    let nextHour: SchedulerViewHour = this.day.hours[hourIndex + 1];
    //    if (nextHour) {
    //        let nextSegment: SchedulerViewHourSegment = nextHour.segments[0];
    //        return nextSegment.events[0];
    //    }
    //    return null;
    // }

    // private sameEventInNextSegment(segmentIndex: number): CalendarSchedulerEvent {
    //    let nextSegment: SchedulerViewHourSegment = this.hour.segments[segmentIndex + 1];
    //    if (nextSegment) {
    //        return nextSegment.events[0];
    //    }
    //    return null;
    // }
}
