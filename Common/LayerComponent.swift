//
//  Layer.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 15.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class LayerComponent: GKComponent {
    
    let node = Node()
    var parallaxFactor: CGFloat = 1.0
    
    func addChild(_ child: SKNode) {
        
        self.node.addChild(child)
    }
}
