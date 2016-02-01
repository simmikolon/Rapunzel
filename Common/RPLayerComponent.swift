//
//  RPLayer.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 15.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPLayerComponent: GKComponent {
    
    let node = RPNode()
    var parallaxFactor: CGFloat = 1.0
    
    func addChild(child: SKNode) {
        
        self.node.addChild(child)
    }
}
