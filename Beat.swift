//
//  Beat.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.04.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

enum BeatType {
    case Empty
    case NotEmpty
}

struct Beat {
    
    var elements: [BeatElement]
    let type: BeatType
    
    init(withType type: BeatType = .Empty) {
        
        elements = []
        self.type = type
    }
}