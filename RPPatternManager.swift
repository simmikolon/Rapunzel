//
//  RPPatternControllerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 10.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

struct RPPatternSettings {
    
    static let elementsPerBeat: Int = 5
    static let lengthOfBeat: CGFloat = 300
}

protocol RPPatternManagerDelegate: class {
    
    func createBeatElement(beatElement: RPBeatElement, offset: CGFloat)
}

class RPPatternManager {

    unowned let renderComponent: RPRenderComponent
    
    weak var delegate: RPPatternManagerDelegate?
    weak var pattern: RPPattern? 
    
    var offset: CGFloat = 0
    var upperBeat: Int = 0
    var lowerBeat: Int = 0
    
    private var lastScrollingDelta: CGFloat = 0
    
    init(withLayerEntity layerEntity: RPLayerEntity, pattern: RPPattern? = nil, delegate: RPPatternManagerDelegate? = nil) {
        
        self.delegate = delegate
        self.renderComponent = layerEntity.renderComponent
        self.pattern = pattern
        
        if self.pattern != nil {
            
            createStartupPatternBeats()
        }
    }
    
    func addBeat() {
        
        if let pattern = self.pattern {
            
            let beat = pattern.beats[pattern.cursor]
            
            if beat.type != .Empty {
                
                for element in beat.elements {
                    
                    if let delegate = self.delegate {
                        
                        delegate.createBeatElement(element, offset: offset)
                    }
                }
            }
            
            pattern.increaseCursor()
            offset += RPPatternSettings.lengthOfBeat
        }
    }
    
    func createStartupPatternBeats() {
        
        let screenSize = CGSize(width: RPGameSceneSettings.width, height: RPGameSceneSettings.height)
        
        while offset < screenSize.height { addBeat() }
        
        addBeat()
    }
    
    func didScrollUpOneBeat() {
        addBeat()
    }
    
    func didScrollDownOneBeat() {
    }
    
    // MARK: - Lifecycle
    
    func update() {
        
        let scrollingDelta = renderComponent.node.scene?.convertPoint(renderComponent.node.position, fromNode: renderComponent.node.parent!)
        
        if scrollingDelta!.y - lastScrollingDelta < -RPPatternSettings.lengthOfBeat {
            didScrollUpOneBeat()
            lastScrollingDelta = scrollingDelta!.y
        }
            
        else if scrollingDelta!.y - lastScrollingDelta > RPPatternSettings.lengthOfBeat {
            didScrollDownOneBeat()
            lastScrollingDelta = scrollingDelta!.y
        }
    }
}
