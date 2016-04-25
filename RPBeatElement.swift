//
//  RPBeatElement.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.04.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

enum RPBeatElementType {
    case LeftTreePlatform
    case RightTreePlatform
    case Empty
}

struct RPBeatElement {
    
    let type: RPBeatElementType
    
    init(withType type: RPBeatElementType = .Empty) {
        
        self.type = type
    }
}
